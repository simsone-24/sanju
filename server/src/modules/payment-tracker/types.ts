import { OrderStatus, PaymentMethod, PaymentTrackerStatus } from '@prisma/client';

// "payment/payment.md" §Payment Tracker Dashboard — the three status cards collapse the four
// statuses into three buckets (Advance Paid and Partial Payment are both "money in, not settled").
// Kept here, not in the UI, so the cards, their click-through filter and the counts share one map.
export const PAYMENT_TRACKER_STATUS_GROUPS = {
  PENDING: [PaymentTrackerStatus.PENDING],
  PARTIAL: [PaymentTrackerStatus.ADVANCE_PAID, PaymentTrackerStatus.PARTIAL_PAYMENT],
  PAID: [PaymentTrackerStatus.FULLY_PAID],
} as const satisfies Record<string, readonly PaymentTrackerStatus[]>;

export type PaymentTrackerStatusGroup = keyof typeof PAYMENT_TRACKER_STATUS_GROUPS;

export interface ListPaymentTrackerParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  customerId?: number;
  paymentStatus?: PaymentTrackerStatus;
  /** Dashboard-card filter — widens to every status in the group (see PAYMENT_TRACKER_STATUS_GROUPS). */
  statusGroup?: PaymentTrackerStatusGroup;
  orderStatus?: OrderStatus;
  eventDateFrom?: Date;
  eventDateTo?: Date;
}

// One collection being recorded now. The tracker's Collected box takes the amount just received,
// not a new running total, so this always becomes a Payment row of its own with its own receipt.
export interface CollectedEntryInput {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: Date;
  referenceNumber?: string;
}

export interface UpdatePaymentTrackerInput {
  budgetAmount?: number;
  collected?: CollectedEntryInput;
  /** A status to pin manually, or null to hand the status back to automatic recalculation. */
  paymentStatus?: PaymentTrackerStatus | null;
  remarks?: string;
}

// The dashboard's own counts narrow along with every other active list filter — everything list
// accepts except pagination.
export type PaymentTrackerStatsParams = Omit<ListPaymentTrackerParams, 'page' | 'limit'>;

// Three cards: Total Expected Amount (sub: order count), Collected Amount (sub: the count in each
// still-collecting/settled bucket), Pending Amount.
export interface PaymentTrackerStatsResult {
  totalOrders: number;
  totalExpectedAmount: number;
  advanceCount: number;
  partialCount: number;
  completedCount: number;
  totalCollected: number;
  pendingAmount: number;
}

// The automatic status, from the order's own money plus the shape of its receipts. ADVANCE_PAID and
// PARTIAL_PAYMENT both mean "part-collected"; they differ only in whether anything beyond the
// opening advance has come in, which is what nonAdvanceCount reports.
export function derivePaymentTrackerStatus(
  budget: number,
  collected: number,
  nonAdvanceCount: number,
): PaymentTrackerStatus {
  if (collected <= 0) return PaymentTrackerStatus.PENDING;
  if (budget > 0 && collected >= budget) return PaymentTrackerStatus.FULLY_PAID;
  return nonAdvanceCount === 0 ? PaymentTrackerStatus.ADVANCE_PAID : PaymentTrackerStatus.PARTIAL_PAYMENT;
}
