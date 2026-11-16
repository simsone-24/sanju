import { ExpenseCategoryStatus } from '@prisma/client';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { buildPaginationMeta } from '../../utils/pagination';
import * as expenseCategoriesRepository from './repository';
import { CreateExpenseCategoryInput, ListExpenseCategoriesParams, UpdateExpenseCategoryInput } from './types';

const MODULE = 'EXPENSES';

function duplicateNameError(): AppError {
  return new AppError(409, 'An expense category with this name already exists.', [
    { field: 'name', message: 'Category name is already in use.' },
  ]);
}

export async function list(params: ListExpenseCategoriesParams) {
  const { records, totalRecords } = await expenseCategoriesRepository.listExpenseCategories(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export async function getById(companyId: number, id: number) {
  const category = await expenseCategoriesRepository.findExpenseCategoryById(companyId, id);
  if (!category) throw new AppError(404, 'Expense category not found.');
  return category;
}

export async function create(companyId: number, actorId: number, input: CreateExpenseCategoryInput) {
  if (await expenseCategoriesRepository.findExpenseCategoryByName(companyId, input.name)) {
    throw duplicateNameError();
  }

  const category = await expenseCategoriesRepository.createExpenseCategory({
    companyId,
    name: input.name,
    status: ExpenseCategoryStatus.ACTIVE,
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: category.id,
    action: 'CREATE',
    description: `Expense category "${category.name}" created.`,
    performedById: actorId,
  });

  return category;
}

export async function update(companyId: number, actorId: number, id: number, input: UpdateExpenseCategoryInput) {
  const existing = await expenseCategoriesRepository.findExpenseCategoryById(companyId, id);
  if (!existing) throw new AppError(404, 'Expense category not found.');

  if (input.name && input.name !== existing.name) {
    const nameOwner = await expenseCategoriesRepository.findExpenseCategoryByName(companyId, input.name);
    if (nameOwner && nameOwner.id !== id) throw duplicateNameError();
  }

  const category = await expenseCategoriesRepository.updateExpenseCategory(id, {
    name: input.name,
    status: input.status,
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: category.id,
    action: input.status && input.status !== existing.status ? 'STATUS_CHANGE' : 'UPDATE',
    description: `Expense category "${category.name}" updated.`,
    performedById: actorId,
  });

  return category;
}

/**
 * Refuses to delete a category that expenses still reference: a deleted category would leave those
 * expenses pointing at a name the UI can no longer resolve. Marking it inactive is the supported way
 * to retire one — it disappears from the expense form but history stays intact.
 */
export async function remove(companyId: number, actorId: number, id: number): Promise<void> {
  const existing = await expenseCategoriesRepository.findExpenseCategoryById(companyId, id);
  if (!existing) throw new AppError(404, 'Expense category not found.');

  const expenseCount = await expenseCategoriesRepository.countExpensesForCategory(id);
  if (expenseCount > 0) {
    throw new AppError(
      409,
      `Cannot delete "${existing.name}" — ${expenseCount} expense(s) use it. Mark it inactive instead.`,
    );
  }

  await expenseCategoriesRepository.softDeleteExpenseCategory(id);

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: id,
    action: 'DELETE',
    description: `Expense category "${existing.name}" deleted.`,
    performedById: actorId,
  });
}
