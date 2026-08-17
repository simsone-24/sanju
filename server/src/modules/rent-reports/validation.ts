import { RentPaymentMode, RentPaymentStatus, StockReturnStatus } from '@prisma/client';
import { z } from 'zod';

// One filter schema per report, matching the filter lists in "md files/Stock/stock.md" §27. They
// share a shape rather than one permissive schema so a filter a report does not offer is rejected
// instead of quietly ignored.

const dateRange = {
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
};

export const stockOutReportQuerySchema = z.object({
  ...dateRange,
  rentalPersonId: z.string().uuid().optional(),
  rentalItemId: z.string().uuid().optional(),
  search: z.string().trim().min(1).optional(),
});

export const returnReportQuerySchema = z.object({
  ...dateRange,
  rentalPersonId: z.string().uuid().optional(),
  rentalItemId: z.string().uuid().optional(),
  returnStatus: z.nativeEnum(StockReturnStatus).optional(),
  search: z.string().trim().min(1).optional(),
});

export const pendingReturnReportQuerySchema = z.object({
  ...dateRange,
  rentalPersonId: z.string().uuid().optional(),
  rentalItemId: z.string().uuid().optional(),
  search: z.string().trim().min(1).optional(),
});

export const paymentReportQuerySchema = z.object({
  ...dateRange,
  rentalPersonId: z.string().uuid().optional(),
  paymentMode: z.nativeEnum(RentPaymentMode).optional(),
  paymentStatus: z.nativeEnum(RentPaymentStatus).optional(),
  search: z.string().trim().min(1).optional(),
});

export const personSummaryReportQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
});

export type StockOutReportQuerySchema = z.infer<typeof stockOutReportQuerySchema>;
export type ReturnReportQuerySchema = z.infer<typeof returnReportQuerySchema>;
export type PendingReturnReportQuerySchema = z.infer<typeof pendingReturnReportQuerySchema>;
export type PaymentReportQuerySchema = z.infer<typeof paymentReportQuerySchema>;
export type PersonSummaryReportQuerySchema = z.infer<typeof personSummaryReportQuerySchema>;
