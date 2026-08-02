import { z } from 'zod';

const PAYMENT_TYPE_VALUES = ['ADVANCE', 'PARTIAL', 'FINAL'] as const;
const PAYMENT_METHOD_VALUES = ['CASH', 'UPI', 'BANK', 'CARD', 'CHEQUE'] as const;

// maxAmount is a closure param, not a schema field — mirrors the backend's own
// "amount cannot exceed pendingAmount" rule (server/src/modules/payments/service.ts) so the
// user gets the same feedback before the request round-trip, not instead of it.
export function createPaymentSchema(maxAmount: number) {
  return z.object({
    paymentType: z.enum(PAYMENT_TYPE_VALUES),
    amount: z
      .string()
      .min(1, 'Amount is required.')
      .refine((value) => Number(value) > 0, 'Amount must be greater than zero.')
      .refine((value) => Number(value) <= maxAmount, `Amount cannot exceed the pending amount (${maxAmount}).`),
    paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
    paymentDate: z.string().optional().or(z.literal('')),
    referenceNumber: z.string().optional().or(z.literal('')),
    remarks: z.string().optional().or(z.literal('')),
  });
}

export type CreatePaymentFormValues = z.infer<ReturnType<typeof createPaymentSchema>>;
