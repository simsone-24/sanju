import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedUser } from '../auth/types';
import * as userGroupsService from './service';
import { CreateUserGroupSchema, UpdateUserGroupSchema, listUserGroupsQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listUserGroupsQuerySchema, req.query);

    const result = await userGroupsService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      status: query.status,
    });

    sendSuccess(res, result.records, 'User groups retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function listOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const options = await userGroupsService.listOptions(actor.companyId);
    sendSuccess(res, options, 'User groups retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const userGroup = await userGroupsService.getById(actor.companyId, req.params.id);
    sendSuccess(res, userGroup, 'User group retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateUserGroupSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const userGroup = await userGroupsService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, userGroup, 'User group created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateUserGroupSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const userGroup = await userGroupsService.update(actor.companyId, actor.id, req.params.id, req.body);
    sendSuccess(res, userGroup, 'User group updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await userGroupsService.remove(actor.companyId, actor.id, req.params.id);
    sendSuccess(res, null, 'User group deleted successfully.');
  } catch (error) {
    next(error);
  }
}
