import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedUser } from '../auth/types';
import * as stockOutsService from './service';
import {
  CancelStockOutSchema,
  CreateStockOutSchema,
  UpdateStockOutSchema,
  listStockOutsQuerySchema,
} from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listStockOutsQuerySchema, req.query);

    const result = await stockOutsService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      rentalPersonId: query.rentalPersonId,
      returnStatus: query.returnStatus,
      paymentStatus: query.paymentStatus,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    sendSuccess(res, result.records, 'Stock outs retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const stockOut = await stockOutsService.getById(actor.companyId, req.params.id);
    sendSuccess(res, stockOut, 'Stock out retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateStockOutSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const stockOut = await stockOutsService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, stockOut, 'Stock out created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateStockOutSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const stockOut = await stockOutsService.update(actor.companyId, actor.id, req.params.id, req.body);
    sendSuccess(res, stockOut, 'Stock out updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function cancel(
  req: Request<{ id: string }, unknown, CancelStockOutSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const stockOut = await stockOutsService.cancel(actor.companyId, actor.id, req.params.id, req.body.reason);
    sendSuccess(res, stockOut, 'Stock out cancelled successfully.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await stockOutsService.remove(actor.companyId, actor.id, req.params.id);
    sendSuccess(res, null, 'Stock out deleted successfully.');
  } catch (error) {
    next(error);
  }
}
