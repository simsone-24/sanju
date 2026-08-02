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
// early stage (info/blue), appointment (purple), quotation-in-progress (warning/orange),
// order won (success/green), order lost (error/red).
//
// Appointment Fixed uses a literal violet rather than a palette key: the theme has no purple token
// (its `secondary` is grey), and "md files/Enquiry/indexUI.md" §UI Color Suggestions specifies
// #8B5CF6 — the same hue the enquiry list already draws its row accent stripe in.
const ENQUIRY_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  PENDING: { label: 'Pending', color: 'info' },
  APPOINTMENT_FIXED: { label: 'Appointment Fixed', color: '#8B5CF6' },
  QUOTATION_TO_SHARE: { label: 'Quotation to Share', color: 'warning' },
  QUOTATION_SHARED: { label: 'Quotation Shared', color: 'warning' },
  ORDER_CONFIRMED: { label: 'Order Confirmed', color: 'success' },
  ORDER_LOST: { label: 'Order Lost', color: 'error' },
};

const QUOTATION_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  DRAFT: { label: 'Draft', color: 'default' },
  SENT: { label: 'Sent', color: 'info' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
  REVISED: { label: 'Revised', color: 'warning' },
};

// Mirrors server/src/modules/calendar/service.ts's STATUS_COLOR exactly (Blue/Orange/Red/
// Green/Grey semantic grouping), translated to MUI Chip colors, so an order's badge color
// always matches the color it's shown with on the Calendar.
const ORDER_STATUS_CONFIG: Record<string, StatusConfigEntry> = {
  CONFIRMED: { label: 'Confirmed', color: 'info' },
  ADVANCE_PENDING: { label: 'Advance Pending', color: 'info' },
  ADVANCE_RECEIVED: { label: 'Advance Received', color: 'info' },
  PLANNING: { label: 'Planning', color: 'warning' },
  READY: { label: 'Ready', color: 'warning' },
  IN_PROGRESS: { label: 'In Progress', color: 'warning' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CLOSED: { label: 'Closed', color: 'success' },
  BALANCE_PENDING: { label: 'Balance Pending', color: 'error' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
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
// delivered event is a different problem from money not yet due.
export function derivePaymentStatus(
  totalAmount: string | number,
  paidAmount: string | number,
  eventDate?: string,
): PaymentStatus {
  const total = Number(totalAmount);
  const paid = Number(paidAmount);

  if (paid >= total && total > 0) return 'PAID';
  const eventPassed = eventDate ? new Date(eventDate).getTime() < Date.now() : false;
  if (eventPassed) return 'OVERDUE';
  return paid > 0 ? 'PARTIAL' : 'PENDING';
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
