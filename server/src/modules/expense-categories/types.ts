import { ExpenseCategoryStatus } from '@prisma/client';

export interface CreateExpenseCategoryInput {
  name: string;
}

export interface UpdateExpenseCategoryInput {
  name?: string;
  status?: ExpenseCategoryStatus;
}

export interface ListExpenseCategoriesParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  status?: ExpenseCategoryStatus;
}
