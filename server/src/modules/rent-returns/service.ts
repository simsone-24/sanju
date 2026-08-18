import { SequenceType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import { writePayment } from '../rent-payments/inline';
import * as stockOutsRepository from '../rent-stock-outs/repository';
import * as stockOutsService from '../rent-stock-outs/service';
import { roundQuantity } from '../rent-stock-outs/status';
import * as returnsRepository from './repository';
import { CreateStockReturnInput, ListStockReturnsParams } from './types';

const MODULE = 'RENT';

export interface StockReturnResponse {
  id: number;
  returnNo: string;
  returnDate: Date;
  notes: string | null;
  totalReturned: number;
  createdAt: Date;
  createdBy: { id: number; fullName: string } | null;
  stockOut: {
    id: number;
    rentNo: string;
    stockOutDate: Date;
    expectedReturnDate: Date | null;
    issuedQuantity: number;
    returnedQuantity: number;
    balanceQuantity: number;
    returnStatus: string;
    rentalPerson: { id: number; name: string; phone: string };
  };
  items: {
    id: number;
    stockOutItemId: number;
    itemName: string;
    issuedQuantity: number;
    quantityReturned: number;
  }[];
}

function mapStockReturn(record: returnsRepository.StockReturnRecord): StockReturnResponse {
  const issued = Number(record.stockOut.issuedQuantity);
  const returned = Number(record.stockOut.returnedQuantity);

  return {
    id: record.id,
    returnNo: record.returnNo,
    returnDate: record.returnDate,
    notes: record.notes,
    totalReturned: roundQuantity(record.items.reduce((sum, item) => sum + Number(item.quantityReturned), 0)),
    createdAt: record.createdAt,
    createdBy: record.createdBy,
    stockOut: {
      id: record.stockOut.id,
      rentNo: record.stockOut.rentNo,
      stockOutDate: record.stockOut.stockOutDate,
      expectedReturnDate: record.stockOut.expectedReturnDate,
      issuedQuantity: issued,
      returnedQuantity: returned,
      balanceQuantity: roundQuantity(issued - returned),
      returnStatus: record.stockOut.returnStatus,
      rentalPerson: record.stockOut.rentalPerson,
    },
    items: record.items.map((item) => ({
      id: item.id,
      stockOutItemId: item.stockOutItem.id,
      itemName: item.stockOutItem.itemName,
      issuedQuantity: Number(item.stockOutItem.quantity),
      quantityReturned: Number(item.quantityReturned),
    })),
  };
}

export async function list(params: ListStockReturnsParams) {
  const { records, totalRecords } = await returnsRepository.listStockReturns(params);
  return {
    records: records.map(mapStockReturn),
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}

export async function getById(companyId: number, id: number): Promise<StockReturnResponse> {
  const record = await returnsRepository.findStockReturnById(companyId, id);
  if (!record) throw new AppError(404, 'Stock return not found.');
  return mapStockReturn(record);
}

export function getSummary(companyId: number) {
  return returnsRepository.getReturnSummary(companyId);
}

/**
 * Books one return against a stock out (stock.md §15–§17).
 *
 * The stock out's own lines are the authority on what may come back: for each line,
 * `Remaining = Issued − Previously Returned`, and a booking above that is refused with the exact
 * figure that was available (§16). Every check is re-run inside the transaction against the same
 * client that writes the rows, so a return raced against another one is validated on what the
 * database actually holds rather than on a snapshot read beforehand.
 *
 * The return rows and the stock out's recalculated totals land together or not at all (§31).
 */
export async function create(
  companyId: number,
  actorId: number,
  stockOutId: number,
  input: CreateStockReturnInput,
): Promise<StockReturnResponse> {
  const stockOut = await stockOutsService.getWritableCore(companyId, stockOutId);

  const returnNo = await generateDocumentNumber(companyId, SequenceType.RENT_RETURN);
  // Only drawn when money is actually changing hands, so a plain return burns no receipt number.
  const paymentNo = input.collection
    ? await generateDocumentNumber(companyId, SequenceType.RENT_PAYMENT)
    : undefined;

  const created = await prisma.$transaction(async (tx) => {
    const stockOutItems = await stockOutsRepository.listStockOutItems(stockOutId, tx);
    const itemById = new Map(stockOutItems.map((item) => [item.id, item]));

    const lines: { stockOutItemId: number; quantityReturned: number }[] = [];

    for (const line of input.items) {
      const stockOutItem = itemById.get(line.stockOutItemId);
      if (!stockOutItem) {
        throw new AppError(400, 'One or more items do not belong to this stock out.', [
          { field: 'items', message: 'Reload the stock out and try again.' },
        ]);
      }

      const quantity = roundQuantity(line.quantityReturned);
      if (quantity <= 0) continue;

      const remaining = roundQuantity(Number(stockOutItem.quantity) - Number(stockOutItem.returnedQuantity));
      if (quantity > remaining) {
        throw new AppError(
          400,
          `"${stockOutItem.itemName}" has only ${remaining} left to return, but ${quantity} was entered.`,
          [{ field: 'items', message: `Maximum returnable quantity for ${stockOutItem.itemName} is ${remaining}.` }],
        );
      }

      lines.push({ stockOutItemId: line.stockOutItemId, quantityReturned: quantity });
    }

    if (lines.length === 0) {
      throw new AppError(400, 'Enter a return quantity for at least one item.', [
        { field: 'items', message: 'Nothing to return.' },
      ]);
    }

    const stockReturn = await returnsRepository.createStockReturn(
      {
        companyId,
        returnNo,
        stockOutId,
        returnDate: input.returnDate ?? new Date(),
        notes: input.notes,
        createdById: actorId,
        items: lines,
      },
      tx,
    );

    // The goods coming back and the money settling them land together or not at all (stock.md §31).
    if (input.collection && paymentNo) {
      await writePayment(tx, {
        companyId,
        stockOutId,
        rentalPersonId: stockOut.rentalPersonId,
        rentNo: stockOut.rentNo,
        actorId,
        paymentNo,
        input: { ...input.collection, paymentDate: input.returnDate },
      });
    }

    // Once, at the end — it derives both the return status and the payment status from the rows
    // written above, so running it earlier would only have to be repeated.
    await stockOutsService.recalculate(tx, stockOutId);

    return { id: stockReturn.id, totalReturned: roundQuantity(lines.reduce((sum, line) => sum + line.quantityReturned, 0)) };
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: stockOutId,
    action: 'RETURN',
    description: `Return "${returnNo}" recorded against "${stockOut.rentNo}" for ${created.totalReturned} item(s).`,
    performedById: actorId,
    metadata: { stockReturnId: created.id, returnNo },
  });

  if (input.collection && paymentNo) {
    await logActivity({
      companyId,
      module: MODULE,
      referenceId: stockOutId,
      action: 'PAYMENT',
      description: `Payment "${paymentNo}" of ${input.collection.amount} (${input.collection.paymentMode}) collected with return "${returnNo}".`,
      performedById: actorId,
      metadata: { paymentNo, returnNo },
    });
  }

  return getById(companyId, created.id);
}
