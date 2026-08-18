import { Prisma, RentPaymentStatus, StockOutStatus, StockReturnStatus } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListStockOutsParams, StockOutFilters } from './types';

const rentalPersonMiniSelect = {
  id: true,
  name: true,
  phone: true,
  city: true,
  status: true,
} satisfies Prisma.RentalPersonSelect;

const userMiniSelect = { id: true, fullName: true } satisfies Prisma.UserSelect;

const stockOutBaseSelect = {
  id: true,
  rentNo: true,
  stockOutDate: true,
  expectedReturnDate: true,
  subtotal: true,
  discountPercent: true,
  discount: true,
  additionalCharges: true,
  grandTotal: true,
  paidAmount: true,
  issuedQuantity: true,
  returnedQuantity: true,
  returnStatus: true,
  paymentStatus: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  rentalPerson: { select: rentalPersonMiniSelect },
  createdBy: { select: userMiniSelect },
  _count: { select: { items: true, returns: { where: { deletedAt: null } } } },
} satisfies Prisma.StockOutSelect;

const stockOutItemSelect = {
  id: true,
  rentalItemId: true,
  itemName: true,
  quantity: true,
  rate: true,
  amount: true,
  returnedQuantity: true,
  sortOrder: true,
} satisfies Prisma.StockOutItemSelect;

const stockOutDetailSelect = {
  ...stockOutBaseSelect,
  items: { orderBy: { sortOrder: 'asc' }, select: stockOutItemSelect },
  returns: {
    where: { deletedAt: null },
    orderBy: { returnDate: 'desc' },
    select: {
      id: true,
      returnNo: true,
      returnDate: true,
      notes: true,
      createdAt: true,
      createdBy: { select: userMiniSelect },
      items: {
        select: {
          id: true,
          quantityReturned: true,
          stockOutItem: { select: { id: true, itemName: true, quantity: true } },
        },
      },
    },
  },
  payments: {
    where: { deletedAt: null },
    orderBy: { paymentDate: 'desc' },
    select: {
      id: true,
      paymentNo: true,
      paymentDate: true,
      amount: true,
      paymentMode: true,
      referenceNo: true,
      notes: true,
      receivedBy: { select: userMiniSelect },
    },
  },
} satisfies Prisma.StockOutSelect;

export type StockOutBaseRecord = Prisma.StockOutGetPayload<{ select: typeof stockOutBaseSelect }>;
export type StockOutDetailRecord = Prisma.StockOutGetPayload<{ select: typeof stockOutDetailSelect }>;

export function buildStockOutWhere(params: StockOutFilters): Prisma.StockOutWhereInput {
  // The single- and multi-value status filters write the same column, so they are resolved into one
  // condition here — spreading both would let the second silently overwrite the first.
  const returnStatus = params.returnStatusIn
    ? { in: params.returnStatusIn }
    : params.returnStatus;
  const paymentStatus = params.paymentStatusIn
    ? { in: params.paymentStatusIn }
    : params.paymentStatus;

  return {
    companyId: params.companyId,
    deletedAt: null,
    // A cancelled stock out is excluded unless it is asked for by name, so the working lists,
    // dashboards and reports all describe live rentals (stock.md §33).
    status: params.status ?? StockOutStatus.ACTIVE,
    ...(params.rentalPersonId ? { rentalPersonId: params.rentalPersonId } : {}),
    ...(returnStatus ? { returnStatus } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(params.rentalItemId ? { items: { some: { rentalItemId: params.rentalItemId } } } : {}),
    ...(params.paymentMode
      ? { payments: { some: { deletedAt: null, paymentMode: params.paymentMode } } }
      : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          stockOutDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
    ...(params.search
      ? {
          OR: [
            { rentNo: { contains: params.search } },
            { rentalPerson: { name: { contains: params.search } } },
            { rentalPerson: { phone: { contains: params.search } } },
            { items: { some: { itemName: { contains: params.search } } } },
          ],
        }
      : {}),
  };
}

export async function listStockOuts(params: ListStockOutsParams) {
  const where = buildStockOutWhere(params);

  const [records, totalRecords] = await Promise.all([
    prisma.stockOut.findMany({
      where,
      select: stockOutBaseSelect,
      orderBy: [{ stockOutDate: 'desc' }, { createdAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.stockOut.count({ where }),
  ]);

  return { records, totalRecords };
}

/** Unpaginated, capped read for the dashboard panels — no line items, no page count. */
export function findStockOutsFiltered(
  params: StockOutFilters,
  take: number,
  orderBy: Prisma.StockOutOrderByWithRelationInput[] = [{ stockOutDate: 'desc' }, { createdAt: 'desc' }],
) {
  return prisma.stockOut.findMany({ where: buildStockOutWhere(params), select: stockOutBaseSelect, orderBy, take });
}

/** As above, with the line items the report screens break down by item. */
export function listStockOutsForReport(params: StockOutFilters, take: number) {
  return prisma.stockOut.findMany({
    where: buildStockOutWhere(params),
    select: { ...stockOutBaseSelect, items: { orderBy: { sortOrder: 'asc' }, select: stockOutItemSelect } },
    orderBy: [{ stockOutDate: 'desc' }, { createdAt: 'desc' }],
    take,
  });
}

export function countStockOutsFiltered(params: StockOutFilters) {
  return prisma.stockOut.count({ where: buildStockOutWhere(params) });
}

export function findStockOutById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.stockOut.findFirst({ where: { id, companyId, deletedAt: null }, select: stockOutDetailSelect });
}

/** The thin projection the write paths need — no children, no joins. */
export function findStockOutCore(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.stockOut.findFirst({
    where: { id, companyId, deletedAt: null },
    select: {
      id: true,
      rentNo: true,
      companyId: true,
      rentalPersonId: true,
      subtotal: true,
      discountPercent: true,
      discount: true,
      additionalCharges: true,
      grandTotal: true,
      paidAmount: true,
      issuedQuantity: true,
      returnedQuantity: true,
      status: true,
      returnStatus: true,
      paymentStatus: true,
    },
  });
}

/** Just the figure the cache recalculation compares the collected total against. */
export function findStockOutGrandTotal(id: number, client: PrismaClientOrTx = prisma) {
  return client.stockOut.findUnique({ where: { id }, select: { grandTotal: true } });
}

export function listStockOutItems(stockOutId: number, client: PrismaClientOrTx = prisma) {
  return client.stockOutItem.findMany({
    where: { stockOutId },
    orderBy: { sortOrder: 'asc' },
    select: stockOutItemSelect,
  });
}

export interface StockOutItemWriteData {
  rentalItemId?: number;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  sortOrder: number;
}

interface CreateStockOutData {
  companyId: number;
  rentNo: string;
  rentalPersonId: number;
  stockOutDate: Date;
  expectedReturnDate?: Date;
  subtotal: number;
  discountPercent: number;
  discount: number;
  additionalCharges: number;
  grandTotal: number;
  issuedQuantity: number;
  notes?: string;
  createdById: number;
  items: StockOutItemWriteData[];
}

export function createStockOut(data: CreateStockOutData, client: PrismaClientOrTx = prisma) {
  return client.stockOut.create({
    data: {
      companyId: data.companyId,
      rentNo: data.rentNo,
      rentalPersonId: data.rentalPersonId,
      stockOutDate: data.stockOutDate,
      expectedReturnDate: data.expectedReturnDate,
      subtotal: data.subtotal,
      discountPercent: data.discountPercent,
      discount: data.discount,
      additionalCharges: data.additionalCharges,
      grandTotal: data.grandTotal,
      issuedQuantity: data.issuedQuantity,
      notes: data.notes,
      createdById: data.createdById,
      items: { create: data.items },
    },
    select: { id: true },
  });
}

interface UpdateStockOutData {
  stockOutDate?: Date;
  expectedReturnDate?: Date;
  subtotal?: number;
  discountPercent?: number;
  discount?: number;
  additionalCharges?: number;
  grandTotal?: number;
  issuedQuantity?: number;
  notes?: string;
}

/**
 * Rewrites the header and, when `items` is supplied, the whole line set.
 *
 * Replacing the lines is only ever reached for a stock out with no returns (the service refuses the
 * edit otherwise), so no stock_return_items row can be left pointing at a deleted line.
 */
export async function updateStockOut(
  id: number,
  data: UpdateStockOutData,
  items: StockOutItemWriteData[] | undefined,
  client: PrismaClientOrTx = prisma,
) {
  if (items) {
    await client.stockOutItem.deleteMany({ where: { stockOutId: id } });
  }

  return client.stockOut.update({
    where: { id },
    data: {
      stockOutDate: data.stockOutDate,
      expectedReturnDate: data.expectedReturnDate,
      subtotal: data.subtotal,
      discountPercent: data.discountPercent,
      discount: data.discount,
      additionalCharges: data.additionalCharges,
      grandTotal: data.grandTotal,
      issuedQuantity: data.issuedQuantity,
      notes: data.notes,
      ...(items ? { items: { create: items } } : {}),
    },
    select: { id: true },
  });
}

export function updateStockOutStatus(id: number, status: StockOutStatus, client: PrismaClientOrTx = prisma) {
  return client.stockOut.update({ where: { id }, data: { status }, select: { id: true } });
}

export function softDeleteStockOut(id: number, client: PrismaClientOrTx = prisma) {
  return client.stockOut.update({ where: { id }, data: { deletedAt: new Date() } });
}

// ---- Cache recalculation ---------------------------------------------------

/** Returned quantity per line, summed from live (non-deleted) return rows. */
export async function sumReturnedQuantityByStockOutItem(
  stockOutId: number,
  client: PrismaClientOrTx = prisma,
): Promise<Map<number, number>> {
  const grouped = await client.stockReturnItem.groupBy({
    by: ['stockOutItemId'],
    where: { stockOutItem: { stockOutId }, stockReturn: { deletedAt: null } },
    _sum: { quantityReturned: true },
  });

  return new Map(grouped.map((row) => [row.stockOutItemId, Number(row._sum.quantityReturned ?? 0)]));
}

export async function sumPaymentsForStockOut(stockOutId: number, client: PrismaClientOrTx = prisma): Promise<number> {
  const aggregate = await client.rentPayment.aggregate({
    where: { stockOutId, deletedAt: null },
    _sum: { amount: true },
  });
  return Number(aggregate._sum.amount ?? 0);
}

export function setStockOutItemReturnedQuantity(
  id: number,
  returnedQuantity: number,
  client: PrismaClientOrTx = prisma,
) {
  return client.stockOutItem.update({ where: { id }, data: { returnedQuantity } });
}

interface StockOutCacheData {
  issuedQuantity: number;
  returnedQuantity: number;
  paidAmount: number;
  returnStatus: StockReturnStatus;
  paymentStatus: RentPaymentStatus;
}

export function writeStockOutCaches(id: number, data: StockOutCacheData, client: PrismaClientOrTx = prisma) {
  return client.stockOut.update({ where: { id }, data, select: { id: true } });
}

// ---- Guards used by the edit/delete rules (stock.md §32, §33) --------------

export function countReturnsForStockOut(stockOutId: number, client: PrismaClientOrTx = prisma) {
  return client.stockReturn.count({ where: { stockOutId, deletedAt: null } });
}

export function countPaymentsForStockOut(stockOutId: number, client: PrismaClientOrTx = prisma) {
  return client.rentPayment.count({ where: { stockOutId, deletedAt: null } });
}
