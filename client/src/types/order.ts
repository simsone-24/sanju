import type { EventTime } from './enquiry';
import type { PaymentTrackerStatus } from './paymentTracker';
import type { QuotationStatus } from './quotation';

// Order/event lifecycle — 4 stages only. Payment standing (Payment Tracker) and task planning are
// tracked independently and don't derive from this field.
export type OrderStatus = 'YET_TO_START' | 'IN_PROGRESS' | 'ORDER_CLOSED' | 'REJECTED';

export interface OrderListItem {
  id: string;
  orderNumber: string;
  // Null on an order raised from an enquiry that was confirmed before an event date was known —
  // confirming an enquiry always produces an order, and the date is filled in on the order after.
  eventDate: string | null;
  venue: string | null;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  status: OrderStatus;
  createdAt: string;
  customer: { id: string; customerName: string; mobile: string };
  // Event name/type/time come from the linked enquiry — Order itself has no event name column.
  enquiry: { eventName: string | null; eventTime: EventTime | null; eventType: { eventName: string } } | null;
  /** The Payment Tracker's stored status, so both modules report the same payment standing. */
  paymentTracker: { paymentStatus: PaymentTrackerStatus } | null;
}

export interface OrderStats {
  total: number;
  todayEvents: number;
  tomorrowEvents: number;
  thisWeekEvents: number;
  thisMonthEvents: number;
  closed: number;
}

export interface OrderPaymentSummary {
  id: string;
  paymentDate: string;
  paymentType: string;
  amount: string;
  paymentMethod: string;
  receiptNumber: string;
  referenceNumber: string | null;
}

export interface OrderTaskSummary {
  id: string;
  taskName: string;
  taskCategory: 'PLANNING' | 'EXECUTION';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  dueDate: string | null;
  completedDate: string | null;
  assignedTo: { id: string; fullName: string } | null;
  completedBy: { id: string; fullName: string } | null;
}

export interface OrderDocumentSummary {
  id: string;
  documentType: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
}

export interface OrderDetail extends OrderListItem {
  notes: string | null;
  remarks: string | null;
  cancellationReason: string | null;
  updatedAt: string;
  // Widens OrderListItem's enquiry/customer rather than replacing them — the detail endpoint
  // returns a superset (see orderDetailSelect).
  enquiry: {
    id: string;
    enquiryNumber: string;
    eventName: string | null;
    eventTime: EventTime | null;
    eventType: { eventName: string };
  };
  customer: { id: string; customerName: string; mobile: string; email: string | null; address: string | null; createdAt: string };
  // Null when the enquiry was confirmed without any quotation — the order's total then comes from
  // the enquiry's final/estimated budget instead.
  quotation: {
    id: string;
    quotationNumber: string;
    version: number;
    totalAmount: string;
    discount: string;
    pdfPath: string | null;
    status: QuotationStatus;
    quotationDate: string;
  } | null;
  coordinator: { id: string; fullName: string } | null;
  payments: OrderPaymentSummary[];
  tasks: OrderTaskSummary[];
  documents: OrderDocumentSummary[];
}

export interface OrderTimelineEntry {
  id: string;
  action: string;
  description: string | null;
  /**
   * Free-form JSON column. STATUS_CHANGE entries carry `{ from, to }`; entries logged before that
   * was recorded, and every other action, carry nothing — so it is read defensively, never cast.
   */
  metadata: Record<string, unknown> | null;
  performedAt: string;
  performedBy: { id: string; fullName: string } | null;
}

export interface UpdateOrderInput {
  eventDate?: string;
  venue?: string;
  notes?: string;
  remarks?: string;
  coordinatorId?: string;
}

export interface ChangeOrderStatusInput {
  status: OrderStatus;
  cancellationReason?: string;
  remarks?: string;
}

export interface ListOrdersParams {
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  eventDateFrom?: string;
  eventDateTo?: string;
}
