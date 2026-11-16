import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseId } from '../../utils/parseId';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedUser } from '../auth/types';
import * as expenseCategoriesService from './service';
import {
  CreateExpenseCategorySchema,
  UpdateExpenseCategorySchema,
  listExpenseCategoriesQuerySchema,
} from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listExpenseCategoriesQuerySchema, req.query);

    const result = await expenseCategoriesService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      status: query.status,
    });

    sendSuccess(res, result.records, 'Expense categories retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const category = await expenseCategoriesService.getById(actor.companyId, parseId(req.params.id));
    sendSuccess(res, category, 'Expense category retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateExpenseCategorySchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const category = await expenseCategoriesService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, category, 'Expense category created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateExpenseCategorySchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const category = await expenseCategoriesService.update(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, category, 'Expense category updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await expenseCategoriesService.remove(actor.companyId, actor.id, parseId(req.params.id));
    sendSuccess(res, null, 'Expense category deleted successfully.');
  } catch (error) {
    next(error);
  }
}
