import { Prisma, StockOutStatus } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListRentPaymentsParams } from './types';

const userMiniSelect = { id: true, fullName: true } satisfies Prisma.UserSelect;

const rentPaymentSelect = {
  id: true,
  paymentNo: true,
  paymentDate: true,
  amount: true,
  paymentMode: true,
  referenceNo: true,
  notes: true,
  createdAt: true,
  receivedBy: { select: userMiniSelect },
  rentalPerson: { select: { id: true, name: true, phone: true } },
  stockOut: {
    select: {
      id: true,
      rentNo: true,
      stockOutDate: true,
      grandTotal: true,
      paidAmount: true,
      paymentStatus: true,
    },
  },
} satisfies Prisma.RentPaymentSelect;

export type RentPaymentRecord = Prisma.RentPaymentGetPayload<{ select: typeof rentPaymentSelect }>;

function buildWhere(params: Omit<ListRentPaymentsParams, 'page' | 'limit'>): Prisma.RentPaymentWhereInput {
  return {
    companyId: params.companyId,
    deletedAt: null,
    stockOut: { deletedAt: null, status: StockOutStatus.ACTIVE },
    ...(params.stockOutId ? { stockOutId: params.stockOutId } : {}),
    ...(params.rentalPersonId ? { rentalPersonId: params.rentalPersonId } : {}),
    ...(params.paymentMode ? { paymentMode: params.paymentMode } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          paymentDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
    ...(params.search
      ? {
          OR: [
            { paymentNo: { contains: params.search } },
            { referenceNo: { contains: params.search } },
            { stockOut: { rentNo: { contains: params.search } } },
            { rentalPerson: { name: { contains: params.search } } },
            { rentalPerson: { phone: { contains: params.search } } },
          ],
        }
      : {}),
  };
}

export async function listRentPayments(params: ListRentPaymentsParams) {
  const where = buildWhere(params);

  const [records, totalRecords] = await Promise.all([
    prisma.rentPayment.findMany({
      where,
      select: rentPaymentSelect,
      orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.rentPayment.count({ where }),
  ]);

  return { records, totalRecords };
}

/** Unpaginated variant for the payment report, which renders the whole filtered result set. */
export function listRentPaymentsForReport(
  params: Omit<ListRentPaymentsParams, 'page' | 'limit'>,
  take: number,
) {
  return prisma.rentPayment.findMany({
    where: buildWhere(params),
    select: rentPaymentSelect,
    orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
    take,
  });
}

export function findRentPaymentById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.rentPayment.findFirst({ where: { id, companyId, deletedAt: null }, select: rentPaymentSelect });
}

interface CreateRentPaymentData {
  companyId: number;
  paymentNo: string;
  stockOutId: number;
  rentalPersonId: number;
  paymentDate: Date;
  amount: number;
  paymentMode: Prisma.RentPaymentCreateInput['paymentMode'];
  referenceNo?: string;
  notes?: string;
  receivedById: number;
}

export function createRentPayment(data: CreateRentPaymentData, client: PrismaClientOrTx = prisma) {
  return client.rentPayment.create({
    data: {
      companyId: data.companyId,
      paymentNo: data.paymentNo,
      stockOutId: data.stockOutId,
      rentalPersonId: data.rentalPersonId,
      paymentDate: data.paymentDate,
      amount: data.amount,
      paymentMode: data.paymentMode,
      referenceNo: data.referenceNo,
      notes: data.notes,
      receivedById: data.receivedById,
    },
    select: { id: true },
  });
}

export function updateRentPayment(
  id: number,
  data: Prisma.RentPaymentUpdateInput,
  client: PrismaClientOrTx = prisma,
) {
  return client.rentPayment.update({ where: { id }, data, select: { id: true } });
}

export function softDeleteRentPayment(id: number, client: PrismaClientOrTx = prisma) {
  return client.rentPayment.update({ where: { id }, data: { deletedAt: new Date() } });
}

export interface RentPaymentSummaryTotals {
  totalRentalAmount: number;
  totalReceived: number;
  totalPending: number;
  unpaidCount: number;
  partiallyPaidCount: number;
  paidCount: number;
}

/**
 * The payment dashboard's three figures (stock.md §20) plus the status split.
 *
 * Both amounts come from the stock outs, not from the payment rows: "total rental amount" is what
 * was billed, and pairing it with a received total read from the same records keeps the pending
 * figure internally consistent.
 */
export async function getPaymentSummary(companyId: number): Promise<RentPaymentSummaryTotals> {
  const where: Prisma.StockOutWhereInput = { companyId, deletedAt: null, status: StockOutStatus.ACTIVE };

  const [totals, grouped] = await Promise.all([
    prisma.stockOut.aggregate({ where, _sum: { grandTotal: true, paidAmount: true } }),
    prisma.stockOut.groupBy({ by: ['paymentStatus'], where, _count: { _all: true } }),
  ]);

  const totalRentalAmount = Number(totals._sum.grandTotal ?? 0);
  const totalReceived = Number(totals._sum.paidAmount ?? 0);
  const countFor = (status: string) => grouped.find((row) => row.paymentStatus === status)?._count._all ?? 0;

  return {
    totalRentalAmount,
    totalReceived,
    totalPending: Math.round((totalRentalAmount - totalReceived) * 100) / 100,
    unpaidCount: countFor('UNPAID'),
    partiallyPaidCount: countFor('PARTIALLY_PAID'),
    paidCount: countFor('PAID'),
  };
}
