import { z } from 'zod';

// Form values are strings (that is what an <input> holds); the page converts to numbers before
// posting. Each rule mirrors one the server enforces.

export const EXPENSE_PAYMENT_METHODS = ['CASH', 'UPI', 'BANK', 'CARD', 'CHEQUE'] as const;

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export const expenseFormSchema = z.object({
  categoryName: z.string().trim().min(1, 'Select or enter an expense category.').max(100, 'Category name is too long.'),
  expenseDate: z.string().min(1, 'Expense date is required.'),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required.')
    .regex(AMOUNT_PATTERN, 'Enter a valid amount with at most 2 decimal places.')
    .refine((value) => Number(value) > 0, 'Amount must be greater than zero.'),
  paymentMethod: z.enum(EXPENSE_PAYMENT_METHODS, { message: 'Select a payment method.' }),
  paidTo: z.string().trim().max(150, 'Paid to is too long.'),
  description: z.string().trim().max(2000, 'Description is too long.'),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const expenseCategoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required.').max(100, 'Category name is too long.'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type ExpenseCategoryFormValues = z.infer<typeof expenseCategoryFormSchema>;
