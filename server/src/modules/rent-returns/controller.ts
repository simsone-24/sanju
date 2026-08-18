import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { parseId } from '../../utils/parseId';
import { AuthenticatedUser } from '../auth/types';
import * as returnsService from './service';
import { CreateStockReturnSchema, listStockReturnsQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listStockReturnsQuerySchema, req.query);

    const result = await returnsService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      stockOutId: query.stockOutId,
      rentalPersonId: query.rentalPersonId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });

    sendSuccess(res, result.records, 'Stock returns retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function summary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const totals = await returnsService.getSummary(actor.companyId);
    sendSuccess(res, totals, 'Return summary retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const stockReturn = await returnsService.getById(actor.companyId, parseId(req.params.id));
    sendSuccess(res, stockReturn, 'Stock return retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/** Mounted on the stock out router as POST /rent/stock-outs/:id/returns (stock.md §30). */
export async function createForStockOut(
  req: Request<{ id: string }, unknown, CreateStockReturnSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const stockReturn = await returnsService.create(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, stockReturn, 'Stock return recorded successfully.', 201);
  } catch (error) {
    next(error);
  }
}
