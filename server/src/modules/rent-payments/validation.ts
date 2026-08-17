import { RentPaymentMode } from '@prisma/client';
import { z } from 'zod';

export const createRentPaymentSchema = z.object({
  stockOutId: z.string().uuid('Select a stock out.'),
  rentalPersonId: z.string().uuid('Select a rental person.'),
  paymentDate: z.coerce.date().optional(),
  amount: z.coerce.number().positive('Payment amount must be greater than zero.'),
  paymentMode: z.nativeEnum(RentPaymentMode),
  referenceNo: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
});

// The stock out and the person a payment was collected against are fixed once it is written —
// moving a receipt to a different transaction would rewrite two balance histories at once. Correct
// a misfiled payment by deleting it and entering it against the right stock out.
export const updateRentPaymentSchema = z
  .object({
    paymentDate: z.coerce.date().optional(),
    amount: z.coerce.number().positive().optional(),
    paymentMode: z.nativeEnum(RentPaymentMode).optional(),
    referenceNo: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const listRentPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  stockOutId: z.string().uuid().optional(),
  rentalPersonId: z.string().uuid().optional(),
  paymentMode: z.nativeEnum(RentPaymentMode).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateRentPaymentSchema = z.infer<typeof createRentPaymentSchema>;
export type UpdateRentPaymentSchema = z.infer<typeof updateRentPaymentSchema>;
export type ListRentPaymentsQuerySchema = z.infer<typeof listRentPaymentsQuerySchema>;
