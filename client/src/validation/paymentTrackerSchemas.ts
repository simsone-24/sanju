import { z } from 'zod';

const PAYMENT_METHOD_VALUES = ['CASH', 'UPI', 'BANK', 'CARD', 'CHEQUE'] as const;

// The four stored statuses, in the order they progress. The dropdown offers exactly these — the
// form no longer exposes a way to hand the status back to automatic recalculation.
export const PAYMENT_STATUS_CHOICES = [
  'PENDING',
  'ADVANCE_PAID',
  'PARTIAL_PAYMENT',
  'FULLY_PAID',
] as const;

/**
 * §Edit Payment. Budget is view-only in this form (there is no field to change it), so the only
 * cross-field rule left is the collected amount against the balance still owed. `remaining` is a
 * closure param rather than a field, computed by the caller from the order's own stored budget and
 * collected-so-far — it mirrors the backend's own guard (server/src/modules/payment-tracker/service.ts)
 * so the user sees the same message before the round-trip, not instead of it.
 */
export function updatePaymentTrackerSchema(remaining: number) {
  return z
    .object({
      // The amount being collected right now. Blank means "no collection in this save".
      collectedAmount: z.string().optional().or(z.literal('')),
      paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
      paymentDate: z.string().optional().or(z.literal('')),
      paymentStatus: z.enum(PAYMENT_STATUS_CHOICES),
      remarks: z.string().max(2000, 'Remarks cannot exceed 2000 characters.').optional().or(z.literal('')),
    })
    .superRefine((values, ctx) => {
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
