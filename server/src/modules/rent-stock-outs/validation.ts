import { RentPaymentMode, RentPaymentStatus, StockOutStatus, StockReturnStatus } from '@prisma/client';
import { z } from 'zod';
import { idSchema } from '../../utils/parseId';

/**
 * Money taken at the moment the stock goes out — the advance a rental person pays up front.
 *
 * Offered on create only. Once the transaction exists, further money is collected through the
 * Payments module or alongside a return, so there is exactly one way to add a second receipt.
 */
const initialPaymentSchema = z.object({
  amount: z.coerce.number().positive('Initial payment must be greater than zero.'),
  paymentMode: z.nativeEnum(RentPaymentMode),
  paymentDate: z.coerce.date().optional(),
  referenceNo: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
});

const stockOutItemSchema = z.object({
  rentalItemId: idSchema().optional(),
  itemName: z.string().trim().min(1, 'Item name is required.'),
  quantity: z.coerce.number().positive('Quantity must be greater than zero.'),
  rate: z.coerce.number().min(0, 'Rate cannot be negative.'),
  sortOrder: z.number().int().min(0).optional(),
});

export const createStockOutSchema = z.object({
  rentalPersonId: idSchema('Select a rental person.'),
  stockOutDate: z.coerce.date().optional(),
  expectedReturnDate: z.coerce.date().optional(),
  discountPercent: z.coerce
    .number()
    .min(0, 'Discount cannot be negative.')
    .max(100, 'Discount cannot exceed 100%.')
    .optional(),
  additionalCharges: z.coerce.number().min(0, 'Additional charges cannot be negative.').optional(),
  notes: z.string().trim().min(1).optional(),
  items: z.array(stockOutItemSchema).min(1, 'Add at least one rental item.'),
  initialPayment: initialPaymentSchema.optional(),
});

// The rental person is deliberately absent: moving a saved stock out to a different person would
// orphan its payments, which are written against both records (stock.md §31).
export const updateStockOutSchema = z
  .object({
    stockOutDate: z.coerce.date().optional(),
    expectedReturnDate: z.coerce.date().optional(),
    discountPercent: z.coerce.number().min(0).max(100, 'Discount cannot exceed 100%.').optional(),
    additionalCharges: z.coerce.number().min(0).optional(),
    notes: z.string().trim().min(1).optional(),
    items: z.array(stockOutItemSchema).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const cancelStockOutSchema = z.object({
  reason: z.string().trim().min(1).optional(),
});

export const listStockOutsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  rentalPersonId: idSchema().optional(),
  returnStatus: z.nativeEnum(StockReturnStatus).optional(),
  paymentStatus: z.nativeEnum(RentPaymentStatus).optional(),
  status: z.nativeEnum(StockOutStatus).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateStockOutSchema = z.infer<typeof createStockOutSchema>;
export type UpdateStockOutSchema = z.infer<typeof updateStockOutSchema>;
export type CancelStockOutSchema = z.infer<typeof cancelStockOutSchema>;
export type ListStockOutsQuerySchema = z.infer<typeof listStockOutsQuerySchema>;
