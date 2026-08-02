import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

export const revenueReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  eventTypeId: z.string().uuid().optional(),
});

export const outstandingReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  eventTypeId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
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
  eventTypeId: z.string().uuid().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
});

export type RevenueReportQuerySchema = z.infer<typeof revenueReportQuerySchema>;
export type OutstandingReportQuerySchema = z.infer<typeof outstandingReportQuerySchema>;
export type CustomerReportQuerySchema = z.infer<typeof customerReportQuerySchema>;
export type EventReportQuerySchema = z.infer<typeof eventReportQuerySchema>;
