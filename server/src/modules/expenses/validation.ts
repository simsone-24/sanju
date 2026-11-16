import { PaymentMethod } from '@prisma/client';
import { z } from 'zod';
import { idSchema } from '../../utils/parseId';
import { MAX_RECEIPTS_PER_EXPENSE } from './types';

// Create and update arrive as multipart/form-data (they may carry a receipt), so every field is
// text on the wire — numbers and dates are coerced rather than expected as JSON types.

const MAX_AMOUNT = 9_999_999_999.99;

const amountSchema = z.coerce
  .number({ invalid_type_error: 'Amount must be a number.' })
  .positive('Amount must be greater than zero.')
  .max(MAX_AMOUNT, 'Amount is too large.')
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, 'Amount can have at most 2 decimal places.');

const expenseDateSchema = z.coerce.date({ invalid_type_error: 'Enter a valid expense date.' });

const paidToSchema = z.string().trim().max(150, 'Paid to is too long.');
const descriptionSchema = z.string().trim().max(2000, 'Description is too long.');

const categoryNameSchema = z.string().trim().min(1, 'Category is required.').max(100, 'Category name is too long.');

const CATEGORY_REQUIRED = 'Select or enter an expense category.';

export const createExpenseSchema = z
  .object({
  categoryId: idSchema('Select an expense category.').optional(),
  categoryName: categoryNameSchema.optional(),
  expenseDate: expenseDateSchema,
  amount: amountSchema,
  paymentMethod: z.nativeEnum(PaymentMethod, { message: 'Select a payment method.' }),
  paidTo: paidToSchema.optional(),
  description: descriptionSchema.optional(),
  })
  .refine((data) => (data.categoryId === undefined) !== (data.categoryName === undefined), {
    message: CATEGORY_REQUIRED,
    path: ['categoryName'],
  });

// No "at least one field" rule here: replacing only the receipt sends no body fields at all.
export const updateExpenseSchema = z
  .object({
  categoryId: idSchema('Select an expense category.').optional(),
  categoryName: categoryNameSchema.optional(),
  expenseDate: expenseDateSchema.optional(),
  amount: amountSchema.optional(),
  paymentMethod: z.nativeEnum(PaymentMethod, { message: 'Select a payment method.' }).optional(),
  paidTo: paidToSchema.optional(),
  description: descriptionSchema.optional(),
  // A repeated multipart field arrives as an array, a single one as a plain string.
  removeReceiptIds: z
    .preprocess(
      (value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]),
      z.array(idSchema('Invalid receipt.')).max(MAX_RECEIPTS_PER_EXPENSE),
    )
    .optional(),
  })
  .refine((data) => data.categoryId === undefined || data.categoryName === undefined, {
    message: 'Send either a category id or a category name, not both.',
    path: ['categoryName'],
  });

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  categoryId: idSchema().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateExpenseSchema = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseSchema = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuerySchema = z.infer<typeof listExpensesQuerySchema>;
