import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import * as customersService from './service';
import { UpdateCustomerSchema, listCustomersQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listCustomersQuerySchema, req.query);
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);

    const result = await customersService.list({
      companyId: actor.companyId,
      page,
      limit,
      search: query.search,
      city: query.city,
    });

    sendSuccess(res, result.records, 'Customers retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const customer = await customersService.getById(actor.companyId, req.params.id);
    sendSuccess(res, customer, 'Customer retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const history = await customersService.getHistory(actor.companyId, req.params.id);
    sendSuccess(res, history, 'Customer history retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateCustomerSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const customer = await customersService.update(actor.companyId, actor.id, req.params.id, req.body);
    sendSuccess(res, customer, 'Customer updated successfully.');
  } catch (error) {
    next(error);
  }
}
