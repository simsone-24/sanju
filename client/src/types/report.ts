import type { OrderStatus } from './order';
import type { PaymentTrackerStatus } from './paymentTracker';

export interface RevenueReportFilters {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  eventTypeId?: number;
  /** Narrows the orders table only; the summary cards still describe the whole period. */
  paymentStatus?: PaymentTrackerStatus;
  /** Narrows the orders table only: orders with money received (COLLECTED) or a balance owing (PENDING). */
  orderBalance?: 'COLLECTED' | 'PENDING';
}

/** One order in the Revenue report's table — the same shape of row the Payment Tracker lists. */
export interface RevenueOrderRow {
  id: number;
  orderNumber: string;
  /** Null on an order confirmed before its event date was known. */
  eventDate: string | null;
  status: OrderStatus;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  customer: { id: number; customerName: string; mobile: string | null };
  enquiry: { eventName: string | null; eventType: { eventName: string } } | null;
  paymentTracker: { paymentStatus: PaymentTrackerStatus; statusManual: boolean } | null;
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

/** Orders per Payment Tracker status. */
export interface PaymentStatusCounts {
  pending: number;
  advancePaid: number;
  partialPayment: number;
  fullyPaid: number;
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
  /** The orders behind the three amounts above: all of them, those with money received, those with a balance. */
  orderCount: number;
  collectedOrderCount: number;
  pendingOrderCount: number;
  /** The Collected and Pending orders split by Payment Tracker status. */
  collectedByStatus: PaymentStatusCounts;
  pendingByStatus: PaymentStatusCounts;
  monthly: RevenueMonthlyPoint[];
  methodBreakdown: RevenueMethodBreakdown[];
}

export interface RevenueReportResult {
  summary: RevenueReportSummary;
  orders: RevenueOrderRow[];
}

export interface OutstandingReportFilters {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  eventTypeId?: number;
  customerId?: number;
  /** Narrows the orders table only; the summary cards still describe the whole period. */
  paymentStatus?: PaymentTrackerStatus;
}

export interface OutstandingOrderRow {
  id: number;
  orderNumber: string;
  /** Null on an order confirmed before its event date was known. */
  eventDate: string | null;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  status: OrderStatus;
  customer: { id: number; customerName: string; mobile: string | null };
  enquiry: { eventName: string | null; eventType: { eventName: string } } | null;
  paymentTracker: { paymentStatus: PaymentTrackerStatus; statusManual: boolean } | null;
}

/** Outstanding orders in one Payment Tracker status, and the balance they still owe. */
export interface OutstandingStatusFigure {
  orderCount: number;
  amount: string;
}

/** Outstanding orders bucketed by event month; `month` is `YYYY-MM`, or null for orders with no event date yet. */
export interface OutstandingMonthlyRow {
  month: string | null;
  orderCount: number;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
}

export interface OutstandingReportResult {
  summary: {
    totalOutstanding: string;
    orderCount: number;
    byStatus: {
      pending: OutstandingStatusFigure;
      advancePaid: OutstandingStatusFigure;
      partialPayment: OutstandingStatusFigure;
    };
    monthly: OutstandingMonthlyRow[];
  };
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

export type ExpenseGranularity = 'day' | 'week' | 'month';

export interface ExpenseReportFilters {
  granularity?: ExpenseGranularity;
  dateFrom?: string;
  dateTo?: string;
  categoryId?: number;
}

/** One bucket of the expense trend: `period` is `YYYY-MM-DD` (a day, or the Monday of a week) or `YYYY-MM` (month), oldest first. */
export interface ExpenseTrendPoint {
  period: string;
  amount: number;
  expenseCount: number;
}

export interface ExpenseCategoryBreakdown {
  categoryId: number;
  categoryName: string;
  amount: number;
  expenseCount: number;
}

export interface ExpenseMethodBreakdown {
  paymentMethod: string;
  amount: number;
}

export interface ExpenseReportResult {
  totalAmount: number;
  expenseCount: number;
  byCategory: ExpenseCategoryBreakdown[];
  byMethod: ExpenseMethodBreakdown[];
  granularity: ExpenseGranularity;
  trend: ExpenseTrendPoint[];
}

export interface OrderReportFilters {
  granularity?: ExpenseGranularity;
  dateFrom?: string;
  dateTo?: string;
  eventTypeId?: number;
}

/** One bucket of the orders trend; `period` follows the same format as the expense trend. */
export interface OrderTrendPoint {
  period: string;
  orderCount: number;
  /** Value of the orders whose event falls in the bucket, rejected orders excluded. */
  amount: number;
}

export interface OrderStatusBreakdown {
  status: string;
  orderCount: number;
  amount: number;
}

export interface OrderEventTypeBreakdown {
  eventTypeId: number | null;
  eventTypeName: string;
  orderCount: number;
  amount: number;
}

export interface OrderReportResult {
  totalOrders: number;
  totalValue: number;
  granularity: ExpenseGranularity;
  byStatus: OrderStatusBreakdown[];
  byEventType: OrderEventTypeBreakdown[];
  trend: OrderTrendPoint[];
}
