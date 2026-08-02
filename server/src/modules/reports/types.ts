import { OrderStatus } from '@prisma/client';

export interface RevenueReportParams {
  companyId: string;
  page: number;
  limit: number;
  dateFrom?: Date;
  dateTo?: Date;
  eventTypeId?: string;
}

export interface OutstandingReportParams {
  companyId: string;
  page: number;
  limit: number;
  dateFrom?: Date;
  dateTo?: Date;
  eventTypeId?: string;
  customerId?: string;
}

export interface CustomerReportParams {
  companyId: string;
  page: number;
  limit: number;
  city?: string;
}

export interface EventReportParams {
  companyId: string;
  page: number;
  limit: number;
  dateFrom?: Date;
  dateTo?: Date;
  eventTypeId?: string;
  status?: OrderStatus;
}
