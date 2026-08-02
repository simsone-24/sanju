import { z } from 'zod';

const PAYMENT_METHOD_VALUES = ['CASH', 'UPI', 'BANK', 'CARD', 'CHEQUE'] as const;

// "AUTO" is not a server status — it is how the form expresses "stop pinning this and let the
// payments decide", which the API receives as an explicit null.
export const PAYMENT_STATUS_CHOICES = [
  'AUTO',
  'PENDING',
  'ADVANCE_PAID',
  'PARTIAL_PAYMENT',
  'FULLY_PAID',
] as const;

/**
 * §Edit Payment. `collectedSoFar` is a closure param rather than a field: both cross-field rules
 * are measured against it, and it mirrors the backend's own guards
 * (server/src/modules/payment-tracker/service.ts) so the user sees the same message before the
 * round-trip, not instead of it.
 */
export function updatePaymentTrackerSchema(collectedSoFar: number) {
  return z
    .object({
      budgetAmount: z
        .string()
        .min(1, 'Budget is required.')
        .refine((value) => Number(value) > 0, 'Budget must be greater than zero.'),
      // The amount being collected right now. Blank means "no collection in this save".
      collectedAmount: z.string().optional().or(z.literal('')),
      paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
      paymentDate: z.string().optional().or(z.literal('')),
      referenceNumber: z.string().optional().or(z.literal('')),
      paymentStatus: z.enum(PAYMENT_STATUS_CHOICES),
      remarks: z.string().max(2000, 'Remarks cannot exceed 2000 characters.').optional().or(z.literal('')),
    })
    .superRefine((values, ctx) => {
      const budget = Number(values.budgetAmount);

      if (budget < collectedSoFar) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['budgetAmount'],
          message: `Budget cannot be less than the ${collectedSoFar} already collected.`,
        });
      }

      if (!values.collectedAmount) return;

      const amount = Number(values.collectedAmount);
      if (Number.isNaN(amount) || amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['collectedAmount'],
          message: 'Collected amount must be greater than zero.',
        });
        return;
      }

      // Headroom is measured against the budget currently typed in the form, so raising the budget
      // and collecting against the new room works in one save — exactly as the server allows.
      const remaining = budget - collectedSoFar;
      if (amount > remaining) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['collectedAmount'],
          message: `Amount cannot exceed the balance of ${remaining}.`,
        });
      }
    });
}

export type UpdatePaymentTrackerFormValues = z.infer<ReturnType<typeof updatePaymentTrackerSchema>>;
