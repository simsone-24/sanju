import { PaymentMethod } from '@prisma/client';

/**
 * An expense names its category either by id (an existing one) or by name — a name that matches no
 * category creates it in the master, so a new category can be entered straight from the expense form.
 */
export interface CreateExpenseInput {
  categoryId?: number;
  categoryName?: string;
  expenseDate: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  paidTo?: string;
  description?: string;
}

/** An empty string for `paidTo` / `description` clears the stored value. */
export interface UpdateExpenseInput {
  categoryId?: number;
  categoryName?: string;
  expenseDate?: Date;
  amount?: number;
  paymentMethod?: PaymentMethod;
  paidTo?: string;
  description?: string;
  /** Ids of this expense's existing receipts to detach. */
  removeReceiptIds?: number[];
}

/** Most receipts one expense can carry, counting those already attached. */
export const MAX_RECEIPTS_PER_EXPENSE = 10;

/** An uploaded receipt, with its path already made relative to the upload root. */
export interface ReceiptFile {
  originalname: string;
  path: string;
}

export interface ListExpensesParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  categoryId?: number;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
}
