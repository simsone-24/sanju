import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedUser } from '../auth/types';
import * as rentReportsService from './service';
import {
  paymentReportQuerySchema,
  pendingReturnReportQuerySchema,
  personSummaryReportQuerySchema,
  returnReportQuerySchema,
  stockOutReportQuerySchema,
} from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function stockOutReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(stockOutReportQuerySchema, req.query);
    const report = await rentReportsService.stockOutReport(actor.companyId, query);
    sendSuccess(res, report, 'Stock out report generated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function returnReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(returnReportQuerySchema, req.query);
    const report = await rentReportsService.returnReport(actor.companyId, query);
    sendSuccess(res, report, 'Stock return report generated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function pendingReturnReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(pendingReturnReportQuerySchema, req.query);
    const report = await rentReportsService.pendingReturnReport(actor.companyId, query);
    sendSuccess(res, report, 'Pending return report generated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function paymentReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(paymentReportQuerySchema, req.query);
    const report = await rentReportsService.paymentReport(actor.companyId, query);
    sendSuccess(res, report, 'Payment report generated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function personSummaryReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(personSummaryReportQuerySchema, req.query);
    const report = await rentReportsService.personSummaryReport(actor.companyId, query);
    sendSuccess(res, report, 'Person-wise report generated successfully.');
  } catch (error) {
    next(error);
  }
}
