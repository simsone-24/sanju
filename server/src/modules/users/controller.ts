import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { normalizeLimit, normalizePage } from '../../utils/pagination';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedUser } from '../auth/types';
import * as usersService from './service';
import { CreateUserSchema, UpdateUserSchema, listUsersQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listUsersQuerySchema, req.query);

    const result = await usersService.list({
      companyId: actor.companyId,
      page: normalizePage(query.page),
      limit: normalizeLimit(query.limit),
      search: query.search,
      userGroupId: query.userGroupId,
      isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
    });

    sendSuccess(res, result.records, 'Users retrieved successfully.', 200, result.meta);
  } catch (error) {
    next(error);
  }
}

export async function listOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const options = await usersService.listOptions(actor.companyId);
    sendSuccess(res, options, 'Users retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const user = await usersService.getById(actor.companyId, req.params.id);
    sendSuccess(res, user, 'User retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function create(
  req: Request<Record<string, never>, unknown, CreateUserSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const user = await usersService.create(actor.companyId, actor.id, req.body);
    sendSuccess(res, user, 'User created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateUserSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const user = await usersService.update(actor.companyId, actor.id, req.params.id, req.body);
    sendSuccess(res, user, 'User updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function uploadProfilePhoto(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    if (!req.file) {
      throw new AppError(400, 'A photo file is required.', [
        { field: 'photo', message: 'A photo file is required.' },
      ]);
    }

    const relativePath = path.relative(env.uploadPath, req.file.path).split(path.sep).join('/');
    const user = await usersService.updateProfilePhoto(actor.companyId, actor.id, req.params.id, relativePath);
    sendSuccess(res, user, 'Profile photo updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getProfilePhoto(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const relativePath = await usersService.getProfilePhotoPath(actor.companyId, req.params.id);
    res.sendFile(path.resolve(env.uploadPath, relativePath), (error) => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await usersService.remove(actor.companyId, actor.id, req.params.id);
    sendSuccess(res, null, 'User deleted successfully.');
  } catch (error) {
    next(error);
  }
}
