import { Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListRentalItemsParams } from './types';

const rentalItemSelect = {
  id: true,
  itemName: true,
  category: true,
  defaultRentRate: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RentalItemSelect;

export type RentalItemRecord = Prisma.RentalItemGetPayload<{ select: typeof rentalItemSelect }>;

export async function listRentalItems(params: ListRentalItemsParams) {
  const where: Prisma.RentalItemWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.status ? { status: params.status } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.search
      ? {
          OR: [
            { itemName: { contains: params.search } },
            { category: { contains: params.search } },
            { description: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.rentalItem.findMany({
      where,
      select: rentalItemSelect,
      orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.rentalItem.count({ where }),
  ]);

  return { records, totalRecords };
}

/** Distinct categories in use — feeds the category filter/autocomplete without a second master. */
export async function listRentalItemCategories(companyId: number): Promise<string[]> {
  const rows = await prisma.rentalItem.findMany({
    where: { companyId, deletedAt: null, category: { not: null } },
    distinct: ['category'],
    orderBy: { category: 'asc' },
    select: { category: true },
  });
  return rows.map((row) => row.category).filter((category): category is string => Boolean(category));
}

export function findRentalItemById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.rentalItem.findFirst({ where: { id, companyId, deletedAt: null }, select: rentalItemSelect });
}

export function findRentalItemsByIds(companyId: number, ids: number[], client: PrismaClientOrTx = prisma) {
  return client.rentalItem.findMany({
    where: { id: { in: ids }, companyId, deletedAt: null },
    select: rentalItemSelect,
  });
}

export function findRentalItemByName(companyId: number, itemName: string) {
  return prisma.rentalItem.findFirst({ where: { companyId, itemName, deletedAt: null }, select: { id: true } });
}

export function countStockOutLinesForItem(rentalItemId: number) {
  return prisma.stockOutItem.count({ where: { rentalItemId } });
}

export function createRentalItem(data: Prisma.RentalItemUncheckedCreateInput) {
  return prisma.rentalItem.create({ data, select: rentalItemSelect });
}

export function updateRentalItem(id: number, data: Prisma.RentalItemUpdateInput) {
  return prisma.rentalItem.update({ where: { id }, data, select: rentalItemSelect });
}

export function softDeleteRentalItem(id: number) {
  return prisma.rentalItem.update({ where: { id }, data: { deletedAt: new Date() } });
}
