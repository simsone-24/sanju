import { OrderStatus } from '@prisma/client';
import { z } from 'zod';
import { idSchema } from '../../utils/parseId';

export const revenueReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  eventTypeId: idSchema().optional(),
  // Narrows the orders list only — the summary cards always describe the whole period.
  paymentStatus: z.enum(['PENDING', 'ADVANCE_PAID', 'PARTIAL_PAYMENT', 'FULLY_PAID']).optional(),
  // Same, for the Collected / Pending summary cards: orders with money received / still owing.
  orderBalance: z.enum(['COLLECTED', 'PENDING']).optional(),
});

export const outstandingReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  eventTypeId: idSchema().optional(),
  customerId: idSchema().optional(),
  // Narrows the orders table only — the summary cards always describe the whole period.
  paymentStatus: z.enum(['PENDING', 'ADVANCE_PAID', 'PARTIAL_PAYMENT', 'FULLY_PAID']).optional(),
});

export const customerReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  city: z.string().trim().min(1).optional(),
});

export const eventReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  eventTypeId: idSchema().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
});

export const expenseReportQuerySchema = z.object({
  granularity: z.enum(['day', 'week', 'month']).default('month'),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  categoryId: idSchema().optional(),
});

export const orderReportQuerySchema = z.object({
  granularity: z.enum(['day', 'week', 'month']).default('month'),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  eventTypeId: idSchema().optional(),
});

export type OrderReportQuerySchema = z.infer<typeof orderReportQuerySchema>;
export type ExpenseReportQuerySchema = z.infer<typeof expenseReportQuerySchema>;
export type RevenueReportQuerySchema = z.infer<typeof revenueReportQuerySchema>;
export type OutstandingReportQuerySchema = z.infer<typeof outstandingReportQuerySchema>;
export type CustomerReportQuerySchema = z.infer<typeof customerReportQuerySchema>;
export type EventReportQuerySchema = z.infer<typeof eventReportQuerySchema>;
