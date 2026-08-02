import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import * as taskTemplatesService from './service';
import { CreateTaskTemplateSchema, UpdateTaskTemplateSchema, listTaskTemplatesQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listTaskTemplatesQuerySchema, req.query);
    const page = normalizePage(query.page);
    const limit = normalizeLimit(query.limit);

    const result = await taskTemplatesService.list({
      companyId: actor.companyId,
      page,
      limit,
      search: query.search,
      taskCategory: query.taskCategory,
    });

    sendSuccess(res, result.records, 'Task templates retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const taskTemplate = await taskTemplatesService.getById(actor.companyId, req.params.id);
    sendSuccess(res, taskTemplate, 'Task template retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateTaskTemplateSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const taskTemplate = await taskTemplatesService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, taskTemplate, 'Task template created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateTaskTemplateSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const taskTemplate = await taskTemplatesService.update(actor.companyId, actor.id, req.params.id, req.body);
    sendSuccess(res, taskTemplate, 'Task template updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await taskTemplatesService.remove(actor.companyId, actor.id, req.params.id);
    sendSuccess(res, null, 'Task template deleted successfully.');
  } catch (error) {
    next(error);
  }
}
