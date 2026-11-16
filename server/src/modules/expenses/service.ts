import { ExpenseCategoryStatus } from '@prisma/client';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { buildPaginationMeta } from '../../utils/pagination';
import * as expenseCategoriesRepository from '../expense-categories/repository';
import * as expenseCategoriesService from '../expense-categories/service';
import { removeReceiptFile } from './receipt';
import * as expensesRepository from './repository';
import {
  CreateExpenseInput,
  ListExpensesParams,
  MAX_RECEIPTS_PER_EXPENSE,
  ReceiptFile,
  UpdateExpenseInput,
} from './types';

const MODULE = 'EXPENSES';

/**
 * The shape the API returns. The stored receipt path is never exposed — the file is only reachable
 * through the authenticated download endpoint — and the money and date columns are normalised from
 * Prisma's Decimal / Date into plain JSON values.
 */
function toExpense(record: expensesRepository.ExpenseRecord) {
  const { amount, expenseDate, ...rest } = record;
  return {
    ...rest,
    amount: Number(amount),
    expenseDate: expenseDate.toISOString().slice(0, 10),
  };
}

/** A form can only clear an optional text field by sending it empty, which is stored as NULL. */
function emptyToNull(value: string | undefined): string | null | undefined {
  return value === undefined ? undefined : value === '' ? null : value;
}

function assertCategoryActive(category: { name: string; status: ExpenseCategoryStatus }, field: string): void {
  if (category.status === ExpenseCategoryStatus.INACTIVE) {
    throw new AppError(400, `"${category.name}" is inactive and cannot be used for an expense.`, [
      { field, message: 'This category is inactive.' },
    ]);
  }
}

/**
 * Turns whichever of id / name the request carried into a category id. A name is matched against the
 * master first (the column collation makes that case-insensitive, so "rent" finds "Rent") and only
 * created when nothing matches — the master never gets a duplicate. `currentCategoryId` is the
 * category an edited expense already has: it may stay even after being retired.
 */
async function resolveCategoryId(
  companyId: number,
  actorId: number,
  input: { categoryId?: number; categoryName?: string },
  currentCategoryId?: number,
): Promise<number | undefined> {
  if (input.categoryName !== undefined) {
    const existing = await expenseCategoriesRepository.findExpenseCategoryByName(companyId, input.categoryName);
    if (existing) {
      if (existing.id !== currentCategoryId) assertCategoryActive(existing, 'categoryName');
      return existing.id;
    }
    try {
      return (await expenseCategoriesService.create(companyId, actorId, { name: input.categoryName })).id;
    } catch (error) {
      // A concurrent request created the same name between the lookup and the insert.
      if (!(error instanceof AppError) || error.statusCode !== 409) throw error;
      const created = await expenseCategoriesRepository.findExpenseCategoryByName(companyId, input.categoryName);
      if (!created) throw error;
      assertCategoryActive(created, 'categoryName');
      return created.id;
    }
  }

  if (input.categoryId === undefined) return undefined;
  if (input.categoryId === currentCategoryId) return input.categoryId;

  const category = await expenseCategoriesRepository.findExpenseCategoryById(companyId, input.categoryId);
  if (!category) {
    throw new AppError(404, 'Expense category not found.', [
      { field: 'categoryId', message: 'Select an expense category.' },
    ]);
  }
  assertCategoryActive(category, 'categoryId');
  return category.id;
}

export async function list(params: ListExpensesParams) {
  const { records, totalRecords } = await expensesRepository.listExpenses(params);
  return { records: records.map(toExpense), meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export async function getById(companyId: number, id: number) {
  const expense = await expensesRepository.findExpenseById(companyId, id);
  if (!expense) throw new AppError(404, 'Expense not found.');
  return toExpense(expense);
}

export async function create(companyId: number, actorId: number, input: CreateExpenseInput, receipts: ReceiptFile[]) {
  const categoryId = await resolveCategoryId(companyId, actorId, input);
  if (categoryId === undefined) {
    throw new AppError(400, 'Select or enter an expense category.', [
      { field: 'categoryName', message: 'Category is required.' },
    ]);
  }

  const expense = await expensesRepository.createExpense(
    {
      companyId,
      categoryId,
      expenseDate: input.expenseDate,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paidTo: emptyToNull(input.paidTo),
      description: emptyToNull(input.description),
      createdById: actorId,
    },
    receipts,
  );

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: expense.id,
    action: 'CREATE',
    description: `Expense of ${input.amount.toFixed(2)} recorded under "${expense.category.name}".`,
    performedById: actorId,
  });

  return toExpense(expense);
}

export async function update(
  companyId: number,
  actorId: number,
  id: number,
  input: UpdateExpenseInput,
  receipts: ReceiptFile[],
) {
  const existing = await expensesRepository.findExpenseById(companyId, id);
  if (!existing) throw new AppError(404, 'Expense not found.');

  // Only a category the expense is being moved to must be active; an expense may keep one that has
  // since been retired.
  const categoryId = await resolveCategoryId(companyId, actorId, input, existing.category.id);

  const attached = await expensesRepository.listReceiptFiles(id);
  const removeIds = [...new Set(input.removeReceiptIds ?? [])];
  const removing = attached.filter((receipt) => removeIds.includes(receipt.id));
  if (removing.length !== removeIds.length) {
    throw new AppError(400, 'One of the receipts to remove does not belong to this expense.', [
      { field: 'removeReceiptIds', message: 'Unknown receipt.' },
    ]);
  }
  if (attached.length - removing.length + receipts.length > MAX_RECEIPTS_PER_EXPENSE) {
    throw new AppError(400, `An expense can have at most ${MAX_RECEIPTS_PER_EXPENSE} receipts.`, [
      { field: 'receipts', message: `At most ${MAX_RECEIPTS_PER_EXPENSE} receipts.` },
    ]);
  }

  const expense = await expensesRepository.updateExpense(
    id,
    {
      categoryId,
      expenseDate: input.expenseDate,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paidTo: emptyToNull(input.paidTo),
      description: emptyToNull(input.description),
    },
    receipts,
    removeIds,
  );

  // Detached files are deleted only once the rows no longer point at them.
  await Promise.all(removing.map((receipt) => removeReceiptFile(receipt.filePath)));

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: expense.id,
    action: 'UPDATE',
    description: `Expense #${expense.id} under "${expense.category.name}" updated.`,
    performedById: actorId,
  });

  return toExpense(expense);
}

export async function getReceiptForDownload(companyId: number, expenseId: number, receiptId: number) {
  const receipt = await expensesRepository.findReceipt(companyId, expenseId, receiptId);
  if (!receipt) throw new AppError(404, 'Receipt not found.');
  return { filePath: receipt.filePath, fileName: receipt.fileName };
}

/** Soft delete only: the receipt files stay on disk so the record remains auditable. */
export async function remove(companyId: number, actorId: number, id: number): Promise<void> {
  const existing = await expensesRepository.findExpenseById(companyId, id);
  if (!existing) throw new AppError(404, 'Expense not found.');

  await expensesRepository.softDeleteExpense(id);

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: id,
    action: 'DELETE',
    description: `Expense #${id} under "${existing.category.name}" deleted.`,
    performedById: actorId,
  });
}
