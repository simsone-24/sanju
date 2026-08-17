import { Prisma, StockOutStatus } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListRentalPersonsParams } from './types';

const rentalPersonSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  city: true,
  notes: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RentalPersonSelect;

export type RentalPersonRecord = Prisma.RentalPersonGetPayload<{ select: typeof rentalPersonSelect }>;

export async function listRentalPersons(params: ListRentalPersonsParams) {
  const where: Prisma.RentalPersonWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.status ? { status: params.status } : {}),
    ...(params.city ? { city: { contains: params.city } } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search } },
            { phone: { contains: params.search } },
            { email: { contains: params.search } },
            { city: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.rentalPerson.findMany({
      where,
      select: rentalPersonSelect,
      orderBy: { name: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.rentalPerson.count({ where }),
  ]);

  return { records, totalRecords };
}

export interface RentalPersonTotals {
  rentalPersonId: string;
  stockOutCount: number;
  totalAmount: number;
  paidAmount: number;
}

/**
 * Rent totals per person, aggregated in one grouped query rather than a per-row lookup.
 *
 * Cancelled stock outs are excluded: a cancelled transaction owes nothing, so counting its total
 * would leave the person permanently in arrears for stock that was never issued. Pass `personIds`
 * to restrict the aggregate to the current page; omit it for the person-wise report, which covers
 * everyone.
 */
export async function sumStockOutTotalsByPerson(
  companyId: string,
  personIds?: string[],
): Promise<RentalPersonTotals[]> {
  const grouped = await prisma.stockOut.groupBy({
    by: ['rentalPersonId'],
    where: {
      companyId,
      deletedAt: null,
      status: StockOutStatus.ACTIVE,
      ...(personIds ? { rentalPersonId: { in: personIds } } : {}),
    },
    _count: { _all: true },
    _sum: { grandTotal: true, paidAmount: true },
  });

  return grouped.map((row) => ({
    rentalPersonId: row.rentalPersonId,
    stockOutCount: row._count._all,
    totalAmount: Number(row._sum.grandTotal ?? 0),
    paidAmount: Number(row._sum.paidAmount ?? 0),
  }));
}

export interface RentalPersonReturnCounts {
  rentalPersonId: string;
  returnStatus: string;
  count: number;
}

/** Stock out counts per person per return status — the person-wise report's returned/pending split. */
export async function countStockOutsByPersonAndReturnStatus(
  companyId: string,
  personIds?: string[],
): Promise<RentalPersonReturnCounts[]> {
  const grouped = await prisma.stockOut.groupBy({
    by: ['rentalPersonId', 'returnStatus'],
    where: {
      companyId,
      deletedAt: null,
      status: StockOutStatus.ACTIVE,
      ...(personIds ? { rentalPersonId: { in: personIds } } : {}),
    },
    _count: { _all: true },
  });

  return grouped.map((row) => ({
    rentalPersonId: row.rentalPersonId,
    returnStatus: row.returnStatus,
    count: row._count._all,
  }));
}

export function findRentalPersonById(companyId: string, id: string, client: PrismaClientOrTx = prisma) {
  return client.rentalPerson.findFirst({
    where: { id, companyId, deletedAt: null },
    select: rentalPersonSelect,
  });
}

export function findRentalPersonByPhone(companyId: string, phone: string) {
  return prisma.rentalPerson.findFirst({ where: { companyId, phone, deletedAt: null }, select: { id: true, name: true } });
}

export function countStockOutsForPerson(rentalPersonId: string) {
  return prisma.stockOut.count({ where: { rentalPersonId, deletedAt: null } });
}

export function createRentalPerson(data: Prisma.RentalPersonUncheckedCreateInput) {
  return prisma.rentalPerson.create({ data, select: rentalPersonSelect });
}

export function updateRentalPerson(id: string, data: Prisma.RentalPersonUpdateInput) {
  return prisma.rentalPerson.update({ where: { id }, data, select: rentalPersonSelect });
}

export function softDeleteRentalPerson(id: string) {
  return prisma.rentalPerson.update({ where: { id }, data: { deletedAt: new Date() } });
}
