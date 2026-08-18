import { RentPaymentMode } from '@prisma/client';
import { z } from 'zod';
import { idSchema } from '../../utils/parseId';

/**
 * Money collected when the stock comes back — the balance settled at handover, which is when a
 * rental is most often actually paid off. Optional: a return that collects nothing is normal.
 */
const collectionSchema = z.object({
  amount: z.coerce.number().positive('Collection amount must be greater than zero.'),
  paymentMode: z.nativeEnum(RentPaymentMode),
  referenceNo: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
});

// The return screen renders every line of the stock out, most of them with nothing to book, so a
// zero is a legitimate value to post — it simply contributes nothing. The whole return is rejected
// only if no line carries a quantity (below), which is what "nothing was returned" really means.
const stockReturnItemSchema = z.object({
  stockOutItemId: idSchema(),
  quantityReturned: z.coerce.number().min(0, 'Return quantity cannot be negative.'),
});

export const createStockReturnSchema = z
  .object({
    returnDate: z.coerce.date().optional(),
    notes: z.string().trim().min(1).optional(),
    items: z.array(stockReturnItemSchema).min(1, 'Enter the quantity being returned.'),
    collection: collectionSchema.optional(),
  })
  .refine((data) => data.items.some((item) => item.quantityReturned > 0), {
    path: ['items'],
    message: 'Enter a return quantity for at least one item.',
  });

export const listStockReturnsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  stockOutId: idSchema().optional(),
  rentalPersonId: idSchema().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateStockReturnSchema = z.infer<typeof createStockReturnSchema>;
export type ListStockReturnsQuerySchema = z.infer<typeof listStockReturnsQuerySchema>;
