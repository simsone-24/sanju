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
