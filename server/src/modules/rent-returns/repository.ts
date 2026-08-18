import { Prisma, StockOutStatus, StockReturnStatus } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListStockReturnsParams } from './types';

const userMiniSelect = { id: true, fullName: true } satisfies Prisma.UserSelect;

const stockReturnSelect = {
  id: true,
  returnNo: true,
  returnDate: true,
  notes: true,
  createdAt: true,
  createdBy: { select: userMiniSelect },
  stockOut: {
    select: {
      id: true,
      rentNo: true,
      stockOutDate: true,
      expectedReturnDate: true,
      issuedQuantity: true,
      returnedQuantity: true,
      returnStatus: true,
      rentalPerson: { select: { id: true, name: true, phone: true } },
    },
  },
  items: {
    select: {
      id: true,
      quantityReturned: true,
      stockOutItem: { select: { id: true, itemName: true, quantity: true } },
    },
  },
} satisfies Prisma.StockReturnSelect;

export type StockReturnRecord = Prisma.StockReturnGetPayload<{ select: typeof stockReturnSelect }>;

function buildWhere(params: Omit<ListStockReturnsParams, 'page' | 'limit'>): Prisma.StockReturnWhereInput {
  return {
    companyId: params.companyId,
    deletedAt: null,
    // Returns booked against a cancelled stock out stay readable from that record's own page, but
    // they are not part of the live return history.
    stockOut: {
      deletedAt: null,
      status: StockOutStatus.ACTIVE,
      ...(params.rentalPersonId ? { rentalPersonId: params.rentalPersonId } : {}),
    },
    ...(params.stockOutId ? { stockOutId: params.stockOutId } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          returnDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
    ...(params.search
      ? {
          OR: [
            { returnNo: { contains: params.search } },
            { stockOut: { rentNo: { contains: params.search } } },
            { stockOut: { rentalPerson: { name: { contains: params.search } } } },
            { stockOut: { rentalPerson: { phone: { contains: params.search } } } },
          ],
        }
      : {}),
  };
}

export async function listStockReturns(params: ListStockReturnsParams) {
  const where = buildWhere(params);

  const [records, totalRecords] = await Promise.all([
    prisma.stockReturn.findMany({
      where,
      select: stockReturnSelect,
      orderBy: [{ returnDate: 'desc' }, { createdAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.stockReturn.count({ where }),
  ]);

  return { records, totalRecords };
}

export function findStockReturnById(companyId: number, id: number) {
  return prisma.stockReturn.findFirst({ where: { id, companyId, deletedAt: null }, select: stockReturnSelect });
}

interface CreateStockReturnData {
  companyId: number;
  returnNo: string;
  stockOutId: number;
  returnDate: Date;
  notes?: string;
  createdById: number;
  items: { stockOutItemId: number; quantityReturned: number }[];
}

export function createStockReturn(data: CreateStockReturnData, client: PrismaClientOrTx = prisma) {
  return client.stockReturn.create({
    data: {
      companyId: data.companyId,
      returnNo: data.returnNo,
      stockOutId: data.stockOutId,
      returnDate: data.returnDate,
      notes: data.notes,
      createdById: data.createdById,
      items: { create: data.items },
    },
    select: { id: true },
  });
}

/** The most recent return booked against each of the given stock outs — the list's "Last Return". */
export async function findLatestReturnDates(stockOutIds: number[]): Promise<Map<number, Date>> {
  if (stockOutIds.length === 0) return new Map();

  const grouped = await prisma.stockReturn.groupBy({
    by: ['stockOutId'],
    where: { stockOutId: { in: stockOutIds }, deletedAt: null },
    _max: { returnDate: true },
  });

  const dates = new Map<number, Date>();
  for (const row of grouped) {
    if (row._max.returnDate) dates.set(row.stockOutId, row._max.returnDate);
  }
  return dates;
}

export interface ReturnSummaryTotals {
  totalStockOuts: number;
  notReturned: number;
  partialReturned: number;
  returned: number;
  totalIssuedQuantity: number;
  totalReturnedQuantity: number;
}

/**
 * The Stock Return dashboard's counters (stock.md §13), read from the stock outs themselves rather
 * than from the return rows: "not returned" is a stock out with no returns at all, which no query
 * over the returns table can see.
 */
export async function getReturnSummary(companyId: number): Promise<ReturnSummaryTotals> {
  const baseWhere: Prisma.StockOutWhereInput = {
    companyId,
    deletedAt: null,
    status: StockOutStatus.ACTIVE,
  };

  const [grouped, totals] = await Promise.all([
    prisma.stockOut.groupBy({ by: ['returnStatus'], where: baseWhere, _count: { _all: true } }),
    prisma.stockOut.aggregate({ where: baseWhere, _sum: { issuedQuantity: true, returnedQuantity: true } }),
  ]);

  const countFor = (status: StockReturnStatus) =>
    grouped.find((row) => row.returnStatus === status)?._count._all ?? 0;

  return {
    totalStockOuts: grouped.reduce((sum, row) => sum + row._count._all, 0),
    notReturned: countFor(StockReturnStatus.NOT_RETURNED),
    partialReturned: countFor(StockReturnStatus.PARTIAL_RETURNED),
    returned: countFor(StockReturnStatus.RETURNED),
    totalIssuedQuantity: Number(totals._sum.issuedQuantity ?? 0),
    totalReturnedQuantity: Number(totals._sum.returnedQuantity ?? 0),
  };
}
