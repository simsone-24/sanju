import { OrderStatus, PaymentTrackerStatus } from '@prisma/client';

export interface RevenueReportParams {
  companyId: number;
  page: number;
  limit: number;
  dateFrom?: Date;
  dateTo?: Date;
  eventTypeId?: number;
  /** Orders list only: keep orders currently in this Payment Tracker status. */
  paymentStatus?: PaymentTrackerStatus;
  /** Orders list only: keep orders with money received (COLLECTED) or a balance still owing (PENDING). */
  orderBalance?: 'COLLECTED' | 'PENDING';
}

export interface OutstandingReportParams {
  companyId: number;
  page: number;
  limit: number;
  dateFrom?: Date;
  dateTo?: Date;
  eventTypeId?: number;
  customerId?: number;
  /** Orders table only: keep orders currently in this Payment Tracker status. */
  paymentStatus?: PaymentTrackerStatus;
}

export interface CustomerReportParams {
  companyId: number;
  page: number;
  limit: number;
  city?: string;
}

export interface EventReportParams {
  companyId: number;
  page: number;
  limit: number;
  dateFrom?: Date;
  dateTo?: Date;
  eventTypeId?: number;
  status?: OrderStatus;
}

export type ExpenseGranularity = 'day' | 'week' | 'month';

export interface ExpenseReportParams {
  companyId: number;
  /** Bucket size of the trend series: one point per day, Monday-start week or calendar month. */
  granularity: ExpenseGranularity;
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: number;
}

export interface OrderReportParams {
  companyId: number;
  /** Bucket size of the trend series: one point per day, Monday-start week or calendar month. */
  granularity: ExpenseGranularity;
  /** Orders are placed in the window by their event date; an order with no event date set is left out. */
  dateFrom?: Date;
  dateTo?: Date;
  eventTypeId?: number;
}

/** Orders per Payment Tracker status — see payment-tracker's PaymentTrackerStatus. */
export interface PaymentStatusCounts {
  pending: number;
  advancePaid: number;
  partialPayment: number;
  fullyPaid: number;
}
