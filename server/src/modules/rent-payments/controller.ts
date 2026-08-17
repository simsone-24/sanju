import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedUser } from '../auth/types';
import * as rentPaymentsService from './service';
import {
  CreateRentPaymentSchema,
  UpdateRentPaymentSchema,
  listRentPaymentsQuerySchema,
} from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listRentPaymentsQuerySchema, req.query);

    const result = await rentPaymentsService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      stockOutId: query.stockOutId,
      rentalPersonId: query.rentalPersonId,
      paymentMode: query.paymentMode,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    sendSuccess(res, result.records, 'Rent payments retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function summary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const totals = await rentPaymentsService.getSummary(actor.companyId);
    sendSuccess(res, totals, 'Rent payment summary retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const payment = await rentPaymentsService.getById(actor.companyId, req.params.id);
    sendSuccess(res, payment, 'Rent payment retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateRentPaymentSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const payment = await rentPaymentsService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, payment, 'Rent payment recorded successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateRentPaymentSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const payment = await rentPaymentsService.update(actor.companyId, actor.id, req.params.id, req.body);
    sendSuccess(res, payment, 'Rent payment updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await rentPaymentsService.remove(actor.companyId, actor.id, req.params.id);
    sendSuccess(res, null, 'Rent payment deleted successfully.');
  } catch (error) {
    next(error);
  }
}
