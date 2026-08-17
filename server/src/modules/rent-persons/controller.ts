import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedUser } from '../auth/types';
import * as rentPersonsService from './service';
import {
  CreateRentalPersonSchema,
  UpdateRentalPersonSchema,
  listRentalPersonsQuerySchema,
} from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listRentalPersonsQuerySchema, req.query);

    const result = await rentPersonsService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      status: query.status,
      city: query.city,
    });

    sendSuccess(res, result.records, 'Rental persons retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const person = await rentPersonsService.getById(actor.companyId, req.params.id);
    sendSuccess(res, person, 'Rental person retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateRentalPersonSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const person = await rentPersonsService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, person, 'Rental person created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateRentalPersonSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const person = await rentPersonsService.update(actor.companyId, actor.id, req.params.id, req.body);
    sendSuccess(res, person, 'Rental person updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await rentPersonsService.remove(actor.companyId, actor.id, req.params.id);
    sendSuccess(res, null, 'Rental person deleted successfully.');
  } catch (error) {
    next(error);
  }
}
