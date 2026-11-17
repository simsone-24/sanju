import { OrderStatus } from '@prisma/client';

export interface RevenueReportParams {
  companyId: number;
  page: number;
  limit: number;
  dateFrom?: Date;
  dateTo?: Date;
  eventTypeId?: number;
}

export interface OutstandingReportParams {
  companyId: number;
  page: number;
  limit: number;
  dateFrom?: Date;
  dateTo?: Date;
  eventTypeId?: number;
  customerId?: number;
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
