import { SequenceType, StockOutStatus } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import * as rentItemsRepository from '../rent-items/repository';
import { writePayment } from '../rent-payments/inline';
import * as rentPersonsService from '../rent-persons/service';
import * as stockOutsRepository from './repository';
import {
  computeStockOutAmounts,
  deriveRentPaymentStatus,
  deriveReturnStatus,
  roundCurrency,
  roundQuantity,
  type StockOutAmounts,
} from './status';
import { CreateStockOutInput, ListStockOutsParams, StockOutItemInput, UpdateStockOutInput } from './types';

const MODULE = 'RENT';

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

export interface StockOutItemResponse {
  id: number;
  rentalItemId: number | null;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  returnedQuantity: number;
  balanceQuantity: number;
  sortOrder: number;
}

export interface StockOutSummaryResponse {
  id: number;
  rentNo: string;
  stockOutDate: Date;
  expectedReturnDate: Date | null;
  rentalPerson: { id: number; name: string; phone: string; city: string | null; status: string };
  subtotal: number;
  discountPercent: number;
  discount: number;
  additionalCharges: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  issuedQuantity: number;
  returnedQuantity: number;
  pendingQuantity: number;
  returnStatus: string;
  paymentStatus: string;
  status: string;
  notes: string | null;
  totalItems: number;
  returnCount: number;
  createdBy: { id: number; fullName: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockOutReturnResponse {
  id: number;
  returnNo: string;
  returnDate: Date;
  notes: string | null;
  totalReturned: number;
  createdBy: { id: number; fullName: string } | null;
  createdAt: Date;
  items: { id: number; stockOutItemId: number; itemName: string; quantityReturned: number }[];
}

export interface StockOutPaymentResponse {
  id: number;
  paymentNo: string;
  paymentDate: Date;
  amount: number;
  paymentMode: string;
  referenceNo: string | null;
  notes: string | null;
  receivedBy: { id: number; fullName: string } | null;
}

export interface StockOutDetailResponse extends StockOutSummaryResponse {
  items: StockOutItemResponse[];
  returns: StockOutReturnResponse[];
  payments: StockOutPaymentResponse[];
}

export function mapStockOutSummary(record: stockOutsRepository.StockOutBaseRecord): StockOutSummaryResponse {
  const grandTotal = Number(record.grandTotal);
  const paidAmount = Number(record.paidAmount);
  const issuedQuantity = Number(record.issuedQuantity);
  const returnedQuantity = Number(record.returnedQuantity);

  return {
    id: record.id,
    rentNo: record.rentNo,
    stockOutDate: record.stockOutDate,
    expectedReturnDate: record.expectedReturnDate,
    rentalPerson: record.rentalPerson,
    subtotal: Number(record.subtotal),
    discountPercent: Number(record.discountPercent),
    discount: Number(record.discount),
    additionalCharges: Number(record.additionalCharges),
    grandTotal,
    paidAmount,
    balanceAmount: roundCurrency(grandTotal - paidAmount),
    issuedQuantity,
    returnedQuantity,
    pendingQuantity: roundQuantity(issuedQuantity - returnedQuantity),
    returnStatus: record.returnStatus,
    paymentStatus: record.paymentStatus,
    status: record.status,
    notes: record.notes,
    totalItems: record._count.items,
    returnCount: record._count.returns,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function mapStockOutItem(item: {
  id: number;
  rentalItemId: number | null;
  itemName: string;
  quantity: unknown;
  rate: unknown;
  amount: unknown;
  returnedQuantity: unknown;
  sortOrder: number;
}): StockOutItemResponse {
  const quantity = Number(item.quantity);
  const returnedQuantity = Number(item.returnedQuantity);
  return {
    id: item.id,
    rentalItemId: item.rentalItemId,
    itemName: item.itemName,
    quantity,
    rate: Number(item.rate),
    amount: Number(item.amount),
    returnedQuantity,
    balanceQuantity: roundQuantity(quantity - returnedQuantity),
    sortOrder: item.sortOrder,
  };
}

function mapStockOutDetail(record: stockOutsRepository.StockOutDetailRecord): StockOutDetailResponse {
  return {
    ...mapStockOutSummary(record),
    items: record.items.map(mapStockOutItem),
    returns: record.returns.map((entry) => ({
      id: entry.id,
      returnNo: entry.returnNo,
      returnDate: entry.returnDate,
      notes: entry.notes,
      totalReturned: roundQuantity(
        entry.items.reduce((sum, item) => sum + Number(item.quantityReturned), 0),
      ),
      createdBy: entry.createdBy,
      createdAt: entry.createdAt,
      items: entry.items.map((item) => ({
        id: item.id,
        stockOutItemId: item.stockOutItem.id,
        itemName: item.stockOutItem.itemName,
        quantityReturned: Number(item.quantityReturned),
      })),
    })),
    payments: record.payments.map((payment) => ({
      id: payment.id,
      paymentNo: payment.paymentNo,
      paymentDate: payment.paymentDate,
      amount: Number(payment.amount),
      paymentMode: payment.paymentMode,
      referenceNo: payment.referenceNo,
      notes: payment.notes,
      receivedBy: payment.receivedBy,
    })),
  };
}

// ---------------------------------------------------------------------------
// Cache recalculation — the single writer of every derived column on a stock out
// ---------------------------------------------------------------------------

/**
 * Recomputes a stock out's returned quantities, collected total and both statuses from its child
 * rows, and writes them back.
 *
 * Called by every path that can change those children — the stock out's own create/update, a
 * return, and a payment create/update/delete — always inside that caller's transaction, so the
 * cached figures can never disagree with the rows they summarise (stock.md §28, §31).
 *
 * Idempotent by construction: it derives everything from scratch rather than applying a delta, so
 * running it twice, or after a partially-applied edit, still lands on the correct value.
 */
export async function recalculate(tx: PrismaClientOrTx, stockOutId: number): Promise<void> {
  const [items, returnedByItem, paidAmountRaw, totals] = await Promise.all([
    stockOutsRepository.listStockOutItems(stockOutId, tx),
    stockOutsRepository.sumReturnedQuantityByStockOutItem(stockOutId, tx),
    stockOutsRepository.sumPaymentsForStockOut(stockOutId, tx),
    stockOutsRepository.findStockOutGrandTotal(stockOutId, tx),
  ]);

  if (!totals) throw new AppError(404, 'Stock out not found.');

  let issuedQuantity = 0;
  let returnedQuantity = 0;

  for (const item of items) {
    const itemReturned = roundQuantity(returnedByItem.get(item.id) ?? 0);
    issuedQuantity += Number(item.quantity);
    returnedQuantity += itemReturned;

    if (Number(item.returnedQuantity) !== itemReturned) {
      await stockOutsRepository.setStockOutItemReturnedQuantity(item.id, itemReturned, tx);
    }
  }

  issuedQuantity = roundQuantity(issuedQuantity);
  returnedQuantity = roundQuantity(returnedQuantity);
  const paidAmount = roundCurrency(paidAmountRaw);
  const grandTotal = Number(totals.grandTotal);

  await stockOutsRepository.writeStockOutCaches(
    stockOutId,
    {
      issuedQuantity,
      returnedQuantity,
      paidAmount,
      returnStatus: deriveReturnStatus(issuedQuantity, returnedQuantity),
      paymentStatus: deriveRentPaymentStatus(grandTotal, paidAmount),
    },
    tx,
  );
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function list(params: ListStockOutsParams) {
  const { records, totalRecords } = await stockOutsRepository.listStockOuts(params);
  return {
    records: records.map(mapStockOutSummary),
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}

export async function getById(companyId: number, id: number): Promise<StockOutDetailResponse> {
  const record = await stockOutsRepository.findStockOutById(companyId, id);
  if (!record) throw new AppError(404, 'Stock out not found.');
  return mapStockOutDetail(record);
}

/**
 * Resolves a stock out for a write that hangs off it (a return, a payment).
 *
 * Cancelled transactions are refused: they are excluded from every total, so booking a return or a
 * collection against one would write a row nothing ever reads back.
 */
export async function getWritableCore(companyId: number, id: number, client?: PrismaClientOrTx) {
  const stockOut = await stockOutsRepository.findStockOutCore(companyId, id, client);
  if (!stockOut) throw new AppError(404, 'Stock out not found.');
  if (stockOut.status === StockOutStatus.CANCELLED) {
    throw new AppError(400, `Stock out "${stockOut.rentNo}" is cancelled.`);
  }
  return stockOut;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Snapshots each line's name off the rental item master where one is linked, so the stored line
 * describes the item as it was known at issue time (stock.md §28) rather than trusting whatever the
 * browser posted. Lines with no master item keep the typed name.
 */
async function resolveLines(companyId: number, items: StockOutItemInput[]) {
  const masterIds = [...new Set(items.map((item) => item.rentalItemId).filter((id): id is number => Boolean(id)))];
  const masters = masterIds.length
    ? await rentItemsRepository.findRentalItemsByIds(companyId, masterIds)
    : [];
  const masterById = new Map(masters.map((master) => [master.id, master]));

  const missing = masterIds.filter((id) => !masterById.has(id));
  if (missing.length > 0) {
    throw new AppError(400, 'One or more selected rental items no longer exist.', [
      { field: 'items', message: 'Remove or reselect the unavailable items.' },
    ]);
  }

  return items.map((item, index) => {
    const master = item.rentalItemId ? masterById.get(item.rentalItemId) : undefined;
    return {
      rentalItemId: item.rentalItemId,
      itemName: master?.itemName ?? item.itemName,
      quantity: item.quantity,
      rate: item.rate,
      sortOrder: item.sortOrder ?? index,
    };
  });
}

function assertTotalIsPayable(grandTotal: number, paidAmount: number, rentNo: string): void {
  if (grandTotal < paidAmount) {
    throw new AppError(
      400,
      `Grand total (${grandTotal}) cannot be less than the ${paidAmount} already collected on "${rentNo}". Adjust or remove the payments first.`,
      [{ field: 'items', message: 'Total falls below the amount already paid.' }],
    );
  }
}

export async function create(
  companyId: number,
  actorId: number,
  input: CreateStockOutInput,
): Promise<StockOutDetailResponse> {
  await rentPersonsService.assertSelectableForStockOut(companyId, input.rentalPersonId);

  const lines = await resolveLines(companyId, input.items);
  const amounts = computeStockOutAmounts(lines, input.discountPercent ?? 0, input.additionalCharges ?? 0);

  // Allocated outside the transaction: the sequence upsert is atomic on its own, and holding the
  // counter inside a longer transaction would serialise every concurrent stock out behind it. The
  // payment number is only drawn when an advance is actually being taken, so a stock out saved
  // without one does not burn a receipt number.
  const rentNo = await generateDocumentNumber(companyId, SequenceType.RENT_OUT);
  const paymentNo = input.initialPayment
    ? await generateDocumentNumber(companyId, SequenceType.RENT_PAYMENT)
    : undefined;

  const created = await prisma.$transaction(async (tx) => {
    const stockOut = await stockOutsRepository.createStockOut(
      {
        companyId,
        rentNo,
        rentalPersonId: input.rentalPersonId,
        stockOutDate: input.stockOutDate ?? new Date(),
        expectedReturnDate: input.expectedReturnDate,
        subtotal: amounts.subtotal,
        discountPercent: amounts.discountPercent,
        discount: amounts.discount,
        additionalCharges: amounts.additionalCharges,
        grandTotal: amounts.grandTotal,
        issuedQuantity: amounts.issuedQuantity,
        notes: input.notes,
        createdById: actorId,
        items: amounts.items,
      },
      tx,
    );

    // The advance lands in the same transaction as the stock out it pays for (stock.md §31): a
    // stock out that recorded money it never received, or a receipt against a transaction that was
    // rolled back, would both be worse than the whole save failing.
    if (input.initialPayment && paymentNo) {
      await writePayment(tx, {
        companyId,
        stockOutId: stockOut.id,
        rentalPersonId: input.rentalPersonId,
        rentNo,
        actorId,
        paymentNo,
        input: input.initialPayment,
      });
    }

    // Runs last so it sees both the lines and the advance — the stock out lands with its paid
    // amount and payment status already correct rather than needing a second pass.
    await recalculate(tx, stockOut.id);
    return stockOut;
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: created.id,
    action: 'CREATE',
    description: `Stock out "${rentNo}" created for ${amounts.items.length} item(s), total ${amounts.grandTotal}.`,
    performedById: actorId,
  });

  if (input.initialPayment && paymentNo) {
    await logActivity({
      companyId,
      module: MODULE,
      referenceId: created.id,
      action: 'PAYMENT',
      description: `Initial payment "${paymentNo}" of ${input.initialPayment.amount} (${input.initialPayment.paymentMode}) taken with "${rentNo}".`,
      performedById: actorId,
      metadata: { paymentNo },
    });
  }

  return getById(companyId, created.id);
}

/**
 * Edits a saved stock out under the rules of stock.md §32.
 *
 * - No returns and no payments — everything below is editable.
 * - Payments recorded — the header and the lines may change, but the grand total may not fall below
 *   what has already been collected, which would leave the transaction over-paid.
 * - Returns recorded — the line set is frozen. Changing an item or a quantity underneath an existing
 *   return would silently invalidate that return's balance arithmetic, so the request is refused
 *   rather than half-applied; the header (dates, notes, discount, charges) stays editable.
 */
export async function update(
  companyId: number,
  actorId: number,
  id: number,
  input: UpdateStockOutInput,
): Promise<StockOutDetailResponse> {
  const existing = await stockOutsRepository.findStockOutCore(companyId, id);
  if (!existing) throw new AppError(404, 'Stock out not found.');
  if (existing.status === StockOutStatus.CANCELLED) {
    throw new AppError(400, `Stock out "${existing.rentNo}" is cancelled and can no longer be edited.`);
  }

  const returnCount = await stockOutsRepository.countReturnsForStockOut(id);

  if (input.items && returnCount > 0) {
    throw new AppError(
      409,
      `Stock out "${existing.rentNo}" already has ${returnCount} return(s), so its items and quantities can no longer be changed.`,
      [{ field: 'items', message: 'Items are locked once stock has been returned.' }],
    );
  }

  const discountPercent = input.discountPercent ?? Number(existing.discountPercent);
  const additionalCharges = input.additionalCharges ?? Number(existing.additionalCharges);

  // With no new line set the totals are still recomputed, because a changed discount percentage or
  // additional charge moves the grand total even though the lines themselves are untouched — and
  // the discount amount is a function of the subtotal, so editing the lines re-derives it too.
  let lineWrites: stockOutsRepository.StockOutItemWriteData[] | undefined;
  let amounts: StockOutAmounts;

  if (input.items) {
    const lines = await resolveLines(companyId, input.items);
    const computed = computeStockOutAmounts(lines, discountPercent, additionalCharges);
    amounts = computed;
    lineWrites = computed.items;
  } else {
    const storedItems = await stockOutsRepository.listStockOutItems(id);
    amounts = computeStockOutAmounts(
      storedItems.map((item) => ({ quantity: Number(item.quantity), rate: Number(item.rate) })),
      discountPercent,
      additionalCharges,
    );
  }

  assertTotalIsPayable(amounts.grandTotal, Number(existing.paidAmount), existing.rentNo);

  await prisma.$transaction(async (tx) => {
    await stockOutsRepository.updateStockOut(
      existing.id,
      {
        stockOutDate: input.stockOutDate,
        expectedReturnDate: input.expectedReturnDate,
        subtotal: amounts.subtotal,
        discountPercent: amounts.discountPercent,
        discount: amounts.discount,
        additionalCharges: amounts.additionalCharges,
        grandTotal: amounts.grandTotal,
        issuedQuantity: amounts.issuedQuantity,
        notes: input.notes,
      },
      lineWrites,
      tx,
    );

    await recalculate(tx, existing.id);
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: existing.id,
    action: 'UPDATE',
    description: `Stock out "${existing.rentNo}" updated, total ${amounts.grandTotal}.`,
    performedById: actorId,
  });

  return getById(companyId, existing.id);
}

/**
 * Takes a stock out out of circulation without destroying its history (stock.md §33).
 *
 * A cancelled transaction drops out of every list, dashboard count and report total, but its
 * returns and payments stay on record and remain readable from its view page.
 */
export async function cancel(
  companyId: number,
  actorId: number,
  id: number,
  reason?: string,
): Promise<StockOutDetailResponse> {
  const existing = await stockOutsRepository.findStockOutCore(companyId, id);
  if (!existing) throw new AppError(404, 'Stock out not found.');
  if (existing.status === StockOutStatus.CANCELLED) {
    throw new AppError(400, `Stock out "${existing.rentNo}" is already cancelled.`);
  }

  await stockOutsRepository.updateStockOutStatus(id, StockOutStatus.CANCELLED);

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: id,
    action: 'CANCEL',
    description: `Stock out "${existing.rentNo}" cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    performedById: actorId,
  });

  return getById(companyId, id);
}

/**
 * Soft-deletes a stock out that carries no history at all.
 *
 * stock.md §33 — once returns or payments exist the record is financially and operationally
 * auditable, so deletion is refused and the caller is pointed at Cancel instead.
 */
export async function remove(companyId: number, actorId: number, id: number): Promise<void> {
  const existing = await stockOutsRepository.findStockOutCore(companyId, id);
  if (!existing) throw new AppError(404, 'Stock out not found.');

  const [returnCount, paymentCount] = await Promise.all([
    stockOutsRepository.countReturnsForStockOut(id),
    stockOutsRepository.countPaymentsForStockOut(id),
  ]);

  if (returnCount > 0 || paymentCount > 0) {
    throw new AppError(
      409,
      `Stock out "${existing.rentNo}" has ${returnCount} return(s) and ${paymentCount} payment(s) on record and cannot be deleted. Cancel it instead.`,
    );
  }

  await stockOutsRepository.softDeleteStockOut(id);

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: id,
    action: 'DELETE',
    description: `Stock out "${existing.rentNo}" deleted.`,
    performedById: actorId,
  });
}
