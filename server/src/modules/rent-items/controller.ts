import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { parseId } from '../../utils/parseId';
import { AuthenticatedUser } from '../auth/types';
import * as rentItemsService from './service';
import { CreateRentalItemSchema, UpdateRentalItemSchema, listRentalItemsQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listRentalItemsQuerySchema, req.query);

    const result = await rentItemsService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      status: query.status,
      category: query.category,
    });

    sendSuccess(res, result.records, 'Rental items retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const categories = await rentItemsService.listCategories(actor.companyId);
    sendSuccess(res, categories, 'Rental item categories retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const item = await rentItemsService.getById(actor.companyId, parseId(req.params.id));
    sendSuccess(res, item, 'Rental item retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateRentalItemSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const item = await rentItemsService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, item, 'Rental item created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateRentalItemSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const item = await rentItemsService.update(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, item, 'Rental item updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await rentItemsService.remove(actor.companyId, actor.id, parseId(req.params.id));
    sendSuccess(res, null, 'Rental item deleted successfully.');
  } catch (error) {
    next(error);
  }
}
