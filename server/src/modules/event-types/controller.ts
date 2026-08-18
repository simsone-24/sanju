import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { parseId } from '../../utils/parseId';
import * as eventTypesService from './service';
import { CreateEventTypeSchema, UpdateEventTypeSchema, listEventTypesQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listEventTypesQuerySchema, req.query);
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);

    const result = await eventTypesService.list({
      companyId: actor.companyId,
      page,
      limit,
      search: query.search,
      status: query.status,
    });

    sendSuccess(res, result.records, 'Event types retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const eventType = await eventTypesService.getById(actor.companyId, parseId(req.params.id));
    sendSuccess(res, eventType, 'Event type retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateEventTypeSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const eventType = await eventTypesService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, eventType, 'Event type created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateEventTypeSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const eventType = await eventTypesService.update(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, eventType, 'Event type updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await eventTypesService.remove(actor.companyId, actor.id, parseId(req.params.id));
    sendSuccess(res, null, 'Event type deleted successfully.');
  } catch (error) {
    next(error);
  }
}
