import type { OrderStatus } from './order';
import type { PaymentMethodType, PaymentType } from './payment';

// "payment/payment.md" §Payment Status. Distinct from the PENDING/PARTIAL/PAID/OVERDUE badge the
// Orders list derives on the fly — this one is stored, because the tracker lets it be overridden.
export type PaymentTrackerStatus = 'PENDING' | 'ADVANCE_PAID' | 'PARTIAL_PAYMENT' | 'FULLY_PAID';

/** Dashboard-card buckets over the four statuses (server: PAYMENT_TRACKER_STATUS_GROUPS). */
export type PaymentTrackerStatusGroup = 'PENDING' | 'PARTIAL' | 'PAID';

export interface PaymentTrackerStatusInfo {
  id: number;
  paymentStatus: PaymentTrackerStatus;
  /** True while the status is pinned by hand and no longer follows the payments. */
  statusManual: boolean;
  remarks: string | null;
}

export interface PaymentTrackerRecord {
  /** The order's id — the tracker deliberately reuses it rather than exposing an id of its own. */
  id: number;
  orderNumber: string;
  /** Null while the order's event date is still unknown — see OrderListItem.eventDate. */
  eventDate: string | null;
  venue: string | null;
  status: OrderStatus;
  /** Budget — the order's total. */
  totalAmount: string;
  /** Collected so far. */
  paidAmount: string;
  /** Balance = budget − collected, maintained server-side. */
  pendingAmount: string;
  customer: { id: number; customerName: string; mobile: string };
  enquiry: { eventName: string | null; eventType: { eventName: string } } | null;
  paymentTracker: PaymentTrackerStatusInfo | null;
}

export interface PaymentTrackerPayment {
  id: number;
  paymentDate: string;
  paymentType: PaymentType;
  amount: string;
  paymentMethod: PaymentMethodType;
  receiptNumber: string;
  referenceNumber: string | null;
  remarks: string | null;
  receivedBy: { id: number; fullName: string } | null;
}

export interface PaymentTrackerDetail extends PaymentTrackerRecord {
  createdAt: string;
  updatedAt: string;
  // Widens PaymentTrackerRecord's customer rather than replacing it — the detail endpoint returns
  // a superset (see trackerDetailSelect).
  customer: { id: number; customerName: string; mobile: string; email: string | null };
  coordinator: { id: number; fullName: string } | null;
  payments: PaymentTrackerPayment[];
  /** Sum of the ADVANCE receipts, for §Financial Summary. */
  advanceAmount: number;
}

// Three cards: Total Expected Amount (sub: order count), Collected Amount (sub: the count in each
// still-collecting/settled bucket), Pending Amount.
export interface PaymentTrackerStats {
  totalOrders: number;
  totalExpectedAmount: number;
  advanceCount: number;
  partialCount: number;
  completedCount: number;
  totalCollected: number;
  pendingAmount: number;
}

export interface ListPaymentTrackerParams {
  page: number;
  limit: number;
  search?: string;
  customerId?: number;
  paymentStatus?: PaymentTrackerStatus;
  statusGroup?: PaymentTrackerStatusGroup;
  orderStatus?: OrderStatus;
  eventDateFrom?: string;
  eventDateTo?: string;
}

/** One collection being recorded — the amount received now, not a new running total. */
export interface CollectedEntryInput {
  amount: number;
  paymentMethod: PaymentMethodType;
  paymentDate?: string;
  referenceNumber?: string;
}

export interface UpdatePaymentTrackerInput {
  budgetAmount?: number;
  collected?: CollectedEntryInput;
  /** A status to pin by hand, or null to hand it back to automatic recalculation. */
  paymentStatus?: PaymentTrackerStatus | null;
  remarks?: string;
}
