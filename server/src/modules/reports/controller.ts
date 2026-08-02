import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import * as reportsService from './service';
import {
  customerReportQuerySchema,
  eventReportQuerySchema,
  outstandingReportQuerySchema,
  revenueReportQuerySchema,
} from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function revenue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(revenueReportQuerySchema, req.query);
    const result = await reportsService.getRevenueReport({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      eventTypeId: query.eventTypeId,
    });
    sendSuccess(res, result.data, 'Revenue report retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function outstanding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(outstandingReportQuerySchema, req.query);
    const result = await reportsService.getOutstandingReport({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      eventTypeId: query.eventTypeId,
      customerId: query.customerId,
    });
    sendSuccess(res, result.data, 'Outstanding report retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function customers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(customerReportQuerySchema, req.query);
    const result = await reportsService.getCustomerReport({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      city: query.city,
    });
    sendSuccess(res, result.data, 'Customer report retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function events(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(eventReportQuerySchema, req.query);
    const result = await reportsService.getEventReport({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      eventTypeId: query.eventTypeId,
      status: query.status,
    });
    sendSuccess(res, result.data, 'Event report retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}
