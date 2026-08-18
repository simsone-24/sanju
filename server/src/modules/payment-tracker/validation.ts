import { OrderStatus, PaymentMethod, PaymentTrackerStatus } from '@prisma/client';
import { z } from 'zod';
import { idSchema } from '../../utils/parseId';
import { PAYMENT_TRACKER_STATUS_GROUPS, PaymentTrackerStatusGroup } from './types';

// Derived from the group map rather than restated, so a new dashboard bucket can never be accepted
// by the API without existing in PAYMENT_TRACKER_STATUS_GROUPS (or vice versa).
const STATUS_GROUP_KEYS = Object.keys(PAYMENT_TRACKER_STATUS_GROUPS) as [
  PaymentTrackerStatusGroup,
  ...PaymentTrackerStatusGroup[],
];

export const listPaymentTrackerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
  customerId: idSchema().optional(),
  paymentStatus: z.nativeEnum(PaymentTrackerStatus).optional(),
  statusGroup: z.enum(STATUS_GROUP_KEYS).optional(),
  orderStatus: z.nativeEnum(OrderStatus).optional(),
  eventDateFrom: z.coerce.date().optional(),
  eventDateTo: z.coerce.date().optional(),
});

export type ListPaymentTrackerQuery = z.infer<typeof listPaymentTrackerQuerySchema>;

// §Edit Payment. Every field is optional — the form saves only what the user touched — but the
// request must carry at least one of them, so an empty body is rejected rather than silently
// writing an activity-log entry for a no-op.
export const updatePaymentTrackerSchema = z
  .object({
    budgetAmount: z.coerce.number().positive('Budget must be greater than zero.').optional(),
    collected: z
      .object({
        amount: z.coerce.number().positive('Collected amount must be greater than zero.'),
        paymentMethod: z.nativeEnum(PaymentMethod),
        paymentDate: z.coerce.date().optional(),
        referenceNumber: z.string().trim().min(1).optional(),
      })
      .optional(),
    // null hands the status back to automatic recalculation; omitted leaves it as it is.
    paymentStatus: z.nativeEnum(PaymentTrackerStatus).nullable().optional(),
    remarks: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Provide at least one field to update.',
  });

export type UpdatePaymentTrackerSchema = z.infer<typeof updatePaymentTrackerSchema>;
