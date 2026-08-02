import type { QuotationStatus } from './quotation';

export type OrderStatus =
  | 'CONFIRMED'
  | 'ADVANCE_PENDING'
  | 'ADVANCE_RECEIVED'
  | 'PLANNING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BALANCE_PENDING'
  | 'CLOSED'
  | 'CANCELLED';

export interface OrderListItem {
  id: string;
  orderNumber: string;
  eventDate: string;
  venue: string | null;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  status: OrderStatus;
  createdAt: string;
  customer: { id: string; customerName: string; mobile: string };
  // Event name/type come from the linked enquiry — Order itself has no event name column.
  enquiry: { eventName: string | null; eventType: { eventName: string } } | null;
}

// Dashboard-card buckets grouping the 10-status workflow (server: ORDER_STATUS_GROUPS).
export type OrderStatusGroup = 'PLANNING' | 'WORK_STARTED' | 'COMPLETED' | 'CANCELLED';

export interface OrderStats {
  total: number;
  planning: number;
  workStarted: number;
  completed: number;
  cancelled: number;
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
  enquiry: { id: string; enquiryNumber: string; eventName: string | null; eventType: { eventName: string } };
  customer: { id: string; customerName: string; mobile: string; email: string | null; address: string | null; createdAt: string };
  quotation: {
    id: string;
    quotationNumber: string;
    version: number;
    totalAmount: string;
    discount: string;
    pdfPath: string | null;
    status: QuotationStatus;
    quotationDate: string;
  };
  coordinator: { id: string; fullName: string } | null;
  payments: OrderPaymentSummary[];
  tasks: OrderTaskSummary[];
  documents: OrderDocumentSummary[];
}

export interface OrderTimelineEntry {
  id: string;
  action: string;
  description: string | null;
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
  statusGroup?: OrderStatusGroup;
  customerId?: string;
  eventDateFrom?: string;
  eventDateTo?: string;
}
