import type { PaymentMethodType } from './payment';

export type ExpenseCategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface ExpenseCategory {
  id: number;
  name: string;
  status: ExpenseCategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseReceipt {
  id: number;
  fileName: string;
}

export interface Expense {
  id: number;
  /** 'YYYY-MM-DD' — a calendar date with no time of day. */
  expenseDate: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  paidTo: string | null;
  description: string | null;
  receipts: ExpenseReceipt[];
  category: { id: number; name: string };
  createdBy: { id: number; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
}

/** The text fields of an expense as posted to the API; the receipt travels beside them. */
export interface ExpenseInput {
  /** An existing category's name, or a new one — the server creates it in the master if it is new. */
  categoryName: string;
  expenseDate: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  paidTo: string;
  description: string;
}

export interface ListExpensesParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: number;
  paymentMethod?: PaymentMethodType;
  dateFrom?: string;
  dateTo?: string;
}

export interface ListExpenseCategoriesParams {
  page: number;
  limit: number;
  search?: string;
  status?: ExpenseCategoryStatus;
}

export interface CreateExpenseCategoryInput {
  name: string;
}

export interface UpdateExpenseCategoryInput {
  name?: string;
  status?: ExpenseCategoryStatus;
}
