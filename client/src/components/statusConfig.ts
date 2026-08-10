export type StatusBadgeColor = 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

interface StatusConfigEntry {
  label: string;
  /** Either a theme palette key, or a literal hex color (e.g. "#EAB308") for hues the theme
   * palette doesn't have a token for — StatusBadge uses the hex directly instead of a palette lookup. */
  color: StatusBadgeColor | `#${string}`;
}

function titleCase(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

// Simplified 6-status enquiry lifecycle. Colour grouping follows 06_UI_UX_GUIDELINES.md §12:
// awaiting action (warning/amber), appointment (purple), quotation-in-progress (warning/orange),
// order won (success/green), order lost (error/red).
//
// Appointment Fixed uses a literal violet rather than a palette key: the theme has no purple token
// (its `secondary` is grey), and "md files/Enquiry/indexUI.md" §UI Color Suggestions specifies
// #8B5CF6 — the same hue the enquiry list already draws its row accent stripe in.
const ENQUIRY_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  PENDING: { label: 'Pending', color: 'warning' },
  APPOINTMENT_FIXED: { label: 'Appointment Fixed', color: '#8B5CF6' },
  QUOTATION_TO_SHARE: { label: 'Quotation to Share', color: 'warning' },
  QUOTATION_SHARED: { label: 'Quotation Shared', color: 'warning' },
  ORDER_CONFIRMED: { label: 'Order Confirmed', color: 'success' },
  ORDER_LOST: { label: 'Order Lost', color: 'error' },
};

// Phrasing matches the Quotation section on the Enquiry Form (EnquiryFormPage's
// quotationStatusLabel) — "has this been shared with, and accepted by, the customer" rather than
// the raw quotation lifecycle terms, so the same status reads identically in both modules.
const QUOTATION_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  DRAFT: { label: 'Quotation Not Shared', color: 'default' },
  SENT: { label: 'Quotation Shared', color: 'info' },
  APPROVED: { label: 'Quotation Confirmed', color: 'success' },
  REJECTED: { label: 'Quotation Rejected', color: 'error' },
  REVISED: { label: 'Revised', color: 'warning' },
};

// Mirrors server/src/modules/calendar/service.ts's STATUS_COLOR exactly (Blue/Orange/Green/Grey),
// translated to MUI Chip colors, so an order's badge color always matches the Calendar.
const ORDER_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  YET_TO_START: { label: 'Yet to Start', color: 'info' },
  IN_PROGRESS: { label: 'In Progress', color: 'warning' },
  ORDER_CLOSED: { label: 'Order Closed', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'default' },
};

const TASK_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  PENDING: { label: 'Pending', color: 'default' },
  IN_PROGRESS: { label: 'In Progress', color: 'info' },
  COMPLETED: { label: 'Completed', color: 'success' },
  SKIPPED: { label: 'Skipped', color: 'warning' },
};

// A task group is either still being written or handed to the team. Draft stays neutral so it
// reads as "not live yet" rather than as a problem; published matches the task Completed green
// only in family, not in weight — it is a state of the plan, not of the work.
const TASK_GROUP_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  DRAFT: { label: 'Draft', color: 'default' },
  PUBLISHED: { label: 'Published', color: 'info' },
};

// Distinct yellow/orange hues per the requested badge scheme — the theme palette's "warning"
// token alone can't tell Pending and In Progress apart, so these two use literal hex colors
// instead of palette keys; Completed/Cancelled reuse the standard success/error tokens.
const APPOINTMENT_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  PENDING: { label: 'Pending', color: '#EAB308' },
  IN_PROGRESS: { label: 'In Progress', color: '#F97316' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'error' },
};

// docs/10_IMPLEMENTATION_DECISIONS.md §6: payment status is DERIVED from the order's amounts,
// never stored — the payments table holds transactions only. Derived by derivePaymentStatus().
const PAYMENT_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  PENDING: { label: 'Pending', color: 'default' },
  PARTIAL: { label: 'Partial', color: 'warning' },
  PAID: { label: 'Paid', color: 'success' },
  OVERDUE: { label: 'Overdue', color: 'error' },
};

// "payment/payment.md" §Payment Status — the Payment Tracker's own four states, STORED rather than
// derived (an authorized user can override them), so this is a separate scale from the derived
// `payment` badge above. Advance Paid and Partial Payment share the warning family because both
// mean "money in, not settled"; they differ only in how far along the collection is.
const PAYMENT_TRACKER_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  PENDING: { label: 'Pending', color: 'default' },
  ADVANCE_PAID: { label: 'Advance Paid', color: '#EAB308' },
  PARTIAL_PAYMENT: { label: 'Partial Payment', color: 'warning' },
  FULLY_PAID: { label: 'Fully Paid', color: 'success' },
};

const ACTIVE_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  ACTIVE: { label: 'Active', color: 'success' },
  INACTIVE: { label: 'Inactive', color: 'default' },
};

const STATUS_CONFIG_BY_TYPE = {
  enquiry: ENQUIRY_STATUS_CONFIG,
  quotation: QUOTATION_STATUS_CONFIG,
  order: ORDER_STATUS_CONFIG,
  task: TASK_STATUS_CONFIG,
  taskGroup: TASK_GROUP_STATUS_CONFIG,
  appointment: APPOINTMENT_STATUS_CONFIG,
  payment: PAYMENT_STATUS_CONFIG,
  paymentTracker: PAYMENT_TRACKER_STATUS_CONFIG,
  active: ACTIVE_STATUS_CONFIG,
} as const;

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

// Derives an order's payment standing from its own amounts (docs §6). `eventDate` promotes an
// unsettled balance to OVERDUE once the event has already happened — money still owed on a
// delivered event is a different problem from money not yet due. An order with no event date set
// yet can never be overdue: nothing has been delivered to be late on.
export function derivePaymentStatus(
  totalAmount: string | number,
  paidAmount: string | number,
  eventDate?: string | null,
): PaymentStatus {
  const total = Number(totalAmount);
  const paid = Number(paidAmount);

  if (paid >= total && total > 0) return 'PAID';
  const eventPassed = eventDate ? new Date(eventDate).getTime() < Date.now() : false;
  if (eventPassed) return 'OVERDUE';
  return paid > 0 ? 'PARTIAL' : 'PENDING';
}

/**
 * The payment badge an order shows in the Orders module.
 *
 * The Payment Tracker's stored status leads, so an order that has only received its advance reads
 * "Advance Paid" in the Orders list exactly as it does in the tracker — the amounts alone cannot
 * tell an advance apart from a part payment, which is why the derived scale used to say "Partial"
 * for both.
 *
 * OVERDUE still wins when the event has already happened with money outstanding: that is a
 * different problem from how much has been collected, and the tracker's four states cannot say it.
 * Falls back to the derived status for an order with no tracker row.
 */
export function resolveOrderPaymentBadge(order: {
  totalAmount: string | number;
  paidAmount: string | number;
  pendingAmount: string | number;
  eventDate?: string | null;
  paymentTracker: { paymentStatus: string } | null;
}): { type: StatusBadgeType; status: string } {
  const derived = derivePaymentStatus(order.totalAmount, order.paidAmount, order.eventDate);
  if (derived === 'OVERDUE' && Number(order.pendingAmount) > 0) return { type: 'payment', status: 'OVERDUE' };
  if (order.paymentTracker) return { type: 'paymentTracker', status: order.paymentTracker.paymentStatus };
  return { type: 'payment', status: derived };
}

export type StatusBadgeType = keyof typeof STATUS_CONFIG_BY_TYPE;

export function resolveStatusConfig(type: StatusBadgeType, status: string): StatusConfigEntry {
  const config = STATUS_CONFIG_BY_TYPE[type][status];
  if (config) return config;
  // A record can arrive without its status field (e.g. a stale API build that no longer selects the
  // column). Fall back to a neutral badge instead of letting titleCase() throw and take down the
  // whole page with it.
  return { label: status ? titleCase(status) : '—', color: 'default' };
}
