import { PaymentMethod, PaymentType } from '@prisma/client';
import { z } from 'zod';

export const createPaymentSchema = z.object({
  paymentDate: z.coerce.date().optional(),
  paymentType: z.nativeEnum(PaymentType),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  referenceNumber: z.string().min(1).optional(),
  remarks: z.string().min(1).optional(),
});

export type CreatePaymentSchema = z.infer<typeof createPaymentSchema>;
