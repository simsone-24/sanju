import type { OrderStatus } from './order';

export interface RevenueReportFilters {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  eventTypeId?: number;
}

export interface RevenuePaymentRow {
  id: number;
  paymentDate: string;
  paymentType: string;
  amount: string;
  paymentMethod: string;
  receiptNumber: string;
  order: { id: number; orderNumber: string; customer: { customerName: string } };
}

export interface RevenueMethodBreakdown {
  paymentMethod: string;
  amount: string;
}

/** One calendar month of collected revenue. `month` is `YYYY-MM`; the API returns them oldest first. */
export interface RevenueMonthlyPoint {
  month: string;
  amount: string;
  paymentCount: number;
}

export interface RevenueReportSummary {
  /** Payment-date based: money that came in during the filtered window. */
  totalRevenue: string;
  paymentCount: number;
  /**
   * Event-date based and reconciling — expected = collected + pending for the events in the
   * window. A different lens from totalRevenue: what those events are worth overall, not what was
   * received inside the date range.
   */
  expectedAmount: string;
  collectedAmount: string;
  pendingAmount: string;
  monthly: RevenueMonthlyPoint[];
  methodBreakdown: RevenueMethodBreakdown[];
}

export interface RevenueReportResult {
  summary: RevenueReportSummary;
  payments: RevenuePaymentRow[];
}

export interface OutstandingReportFilters {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  eventTypeId?: number;
  customerId?: number;
}

export interface OutstandingOrderRow {
  id: number;
  orderNumber: string;
  eventDate: string;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  status: OrderStatus;
  customer: { id: number; customerName: string; mobile: string };
}

export interface OutstandingReportResult {
  summary: { totalOutstanding: string; orderCount: number };
  orders: OutstandingOrderRow[];
}

export interface CustomerReportFilters {
  page: number;
  limit: number;
  city?: string;
}

export interface EventReportFilters {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  eventTypeId?: number;
  status?: OrderStatus;
}

export interface EventReportRow {
  id: number;
  orderNumber: string;
  eventDate: string;
  venue: string | null;
  status: OrderStatus;
  totalAmount: string;
  customer: { id: number; customerName: string };
  enquiry: { eventType: { id: number; eventName: string; colorCode: string | null } };
}

export interface EventStatusCount {
  status: OrderStatus;
  count: number;
}

export interface EventReportResult {
  summary: { totalEvents: number; statusCounts: EventStatusCount[] };
  events: EventReportRow[];
}
