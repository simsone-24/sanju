import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ListExpensesParams, ReceiptFile } from './types';

const expenseSelect = {
  id: true,
  expenseDate: true,
  amount: true,
  paymentMethod: true,
  paidTo: true,
  description: true,
  receipts: { where: { deletedAt: null }, select: { id: true, fileName: true }, orderBy: { id: 'asc' } },
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  createdBy: { select: { id: true, fullName: true } },
} satisfies Prisma.ExpenseSelect;

export type ExpenseRecord = Prisma.ExpenseGetPayload<{ select: typeof expenseSelect }>;

export async function listExpenses(params: ListExpensesParams) {
  const where: Prisma.ExpenseWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.paymentMethod ? { paymentMethod: params.paymentMethod } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          expenseDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
    ...(params.search
      ? {
          OR: [
            { paidTo: { contains: params.search } },
            { description: { contains: params.search } },
            { category: { name: { contains: params.search } } },
          ],
        }
      : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.expense.findMany({
      where,
      select: expenseSelect,
      orderBy: [{ expenseDate: 'desc' }, { id: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return { records, totalRecords };
}

export function findExpenseById(companyId: number, id: number) {
  return prisma.expense.findFirst({ where: { id, companyId, deletedAt: null }, select: expenseSelect });
}

export function createExpense(data: Prisma.ExpenseUncheckedCreateInput, receipts: ReceiptFile[]) {
  return prisma.expense.create({
    data: { ...data, receipts: { create: receipts.map((r) => ({ fileName: r.originalname, filePath: r.path })) } },
    select: expenseSelect,
  });
}

/** Expense fields, receipts added and receipts detached land together or not at all. */
export function updateExpense(
  id: number,
  data: Prisma.ExpenseUncheckedUpdateInput,
  addReceipts: ReceiptFile[],
  removeReceiptIds: number[],
) {
  return prisma.$transaction(async (tx) => {
    if (removeReceiptIds.length > 0) {
      await tx.expenseReceipt.updateMany({
        where: { id: { in: removeReceiptIds }, expenseId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    }
    return tx.expense.update({
      where: { id },
      data: {
        ...data,
        ...(addReceipts.length > 0
          ? { receipts: { create: addReceipts.map((r) => ({ fileName: r.originalname, filePath: r.path })) } }
          : {}),
      },
      select: expenseSelect,
    });
  });
}

export function findReceipt(companyId: number, expenseId: number, receiptId: number) {
  return prisma.expenseReceipt.findFirst({
    where: { id: receiptId, expenseId, deletedAt: null, expense: { companyId, deletedAt: null } },
    select: { id: true, fileName: true, filePath: true },
  });
}

/** Active receipts of one expense with their stored paths — the lookup edits validate against. */
export function listReceiptFiles(expenseId: number) {
  return prisma.expenseReceipt.findMany({
    where: { expenseId, deletedAt: null },
    select: { id: true, filePath: true },
  });
}

export function softDeleteExpense(id: number) {
  return prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
}
