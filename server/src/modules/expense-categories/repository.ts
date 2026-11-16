import { Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListExpenseCategoriesParams } from './types';

const expenseCategorySelect = {
  id: true,
  name: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ExpenseCategorySelect;

export type ExpenseCategoryRecord = Prisma.ExpenseCategoryGetPayload<{ select: typeof expenseCategorySelect }>;

export async function listExpenseCategories(params: ListExpenseCategoriesParams) {
  const where: Prisma.ExpenseCategoryWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.status ? { status: params.status } : {}),
    ...(params.search ? { name: { contains: params.search } } : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.expenseCategory.findMany({
      where,
      select: expenseCategorySelect,
      orderBy: { name: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.expenseCategory.count({ where }),
  ]);

  return { records, totalRecords };
}

export function findExpenseCategoryById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.expenseCategory.findFirst({
    where: { id, companyId, deletedAt: null },
    select: expenseCategorySelect,
  });
}

export function findExpenseCategoryByName(companyId: number, name: string) {
  return prisma.expenseCategory.findFirst({
    where: { companyId, name, deletedAt: null },
    select: { id: true, name: true, status: true },
  });
}

export function countExpensesForCategory(categoryId: number) {
  return prisma.expense.count({ where: { categoryId, deletedAt: null } });
}

export function createExpenseCategory(data: Prisma.ExpenseCategoryUncheckedCreateInput) {
  return prisma.expenseCategory.create({ data, select: expenseCategorySelect });
}

export function updateExpenseCategory(id: number, data: Prisma.ExpenseCategoryUpdateInput) {
  return prisma.expenseCategory.update({ where: { id }, data, select: expenseCategorySelect });
}

export function softDeleteExpenseCategory(id: number) {
  return prisma.expenseCategory.update({ where: { id }, data: { deletedAt: new Date() } });
}
