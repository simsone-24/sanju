import type { OrderStatus } from './order';

export interface RevenueReportFilters {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  eventTypeId?: string;
}

export interface RevenuePaymentRow {
  id: string;
  paymentDate: string;
  paymentType: string;
  amount: string;
  paymentMethod: string;
  receiptNumber: string;
  order: { id: string; orderNumber: string; customer: { customerName: string } };
}

export interface RevenueMethodBreakdown {
  paymentMethod: string;
  amount: string;
}

export interface RevenueReportResult {
  summary: { totalRevenue: string; paymentCount: number; methodBreakdown: RevenueMethodBreakdown[] };
  payments: RevenuePaymentRow[];
}

export interface OutstandingReportFilters {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  eventTypeId?: string;
  customerId?: string;
}

export interface OutstandingOrderRow {
  id: string;
  orderNumber: string;
  eventDate: string;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  status: OrderStatus;
  customer: { id: string; customerName: string; mobile: string };
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
  eventTypeId?: string;
  status?: OrderStatus;
}

export interface EventReportRow {
  id: string;
  orderNumber: string;
  eventDate: string;
  venue: string | null;
  status: OrderStatus;
  totalAmount: string;
  customer: { id: string; customerName: string };
  enquiry: { eventType: { id: string; eventName: string; colorCode: string | null } };
}

export interface EventStatusCount {
  status: OrderStatus;
  count: number;
}

export interface EventReportResult {
  summary: { totalEvents: number; statusCounts: EventStatusCount[] };
  events: EventReportRow[];
}
