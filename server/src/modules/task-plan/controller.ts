import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import { parseId } from '../../utils/parseId';
import * as taskPlanService from './service';
import {
  ChangeTaskGroupStatusSchema,
  CreateTaskGroupSchema,
  CreateTaskItemSchema,
  UpdateTaskGroupSchema,
  UpdateTaskItemSchema,
} from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function listForOrder(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const groups = await taskPlanService.listGroups(actor.companyId, parseId(req.params.id));
    sendSuccess(res, groups, 'Task plan retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function createGroupForOrder(
  req: Request<{ id: string }, unknown, CreateTaskGroupSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const group = await taskPlanService.createGroup(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, group, 'Task group created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateGroup(
  req: Request<{ id: string }, unknown, UpdateTaskGroupSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const group = await taskPlanService.updateGroup(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, group, 'Task group updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function changeGroupStatus(
  req: Request<{ id: string }, unknown, ChangeTaskGroupStatusSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const group = await taskPlanService.changeGroupStatus(
      actor.companyId,
      actor.id,
      parseId(req.params.id),
      req.body.status,
    );
    sendSuccess(res, group, 'Task group status updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function deleteGroup(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await taskPlanService.deleteGroup(actor.companyId, actor.id, parseId(req.params.id));
    sendSuccess(res, null, 'Task group deleted successfully.');
  } catch (error) {
    next(error);
  }
}

export async function createItemForGroup(
  req: Request<{ id: string }, unknown, CreateTaskItemSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const item = await taskPlanService.createItem(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, item, 'Task created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateItem(
  req: Request<{ id: string }, unknown, UpdateTaskItemSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const item = await taskPlanService.updateItem(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, item, 'Task updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await taskPlanService.deleteItem(actor.companyId, actor.id, parseId(req.params.id));
    sendSuccess(res, null, 'Task deleted successfully.');
  } catch (error) {
    next(error);
  }
}

export async function uploadItemPhoto(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    if (!req.file) {
      throw new AppError(400, 'A photo is required.', [{ field: 'photo', message: 'A photo is required.' }]);
    }

    const relativePath = path.relative(env.uploadPath, req.file.path).split(path.sep).join('/');
    const item = await taskPlanService.uploadItemPhoto(actor.companyId, actor.id, parseId(req.params.id), {
      path: relativePath,
    });
    sendSuccess(res, item, 'Completion photo uploaded successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function deleteItemPhoto(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const item = await taskPlanService.removeItemPhoto(actor.companyId, actor.id, parseId(req.params.id));
    sendSuccess(res, item, 'Completion photo removed successfully.');
  } catch (error) {
    next(error);
  }
}

// Authenticated and company-scoped, like order documents — completion photos are internal
// operational evidence and are deliberately not exposed on the public static /uploads mount.
export async function getItemPhoto(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const relativePath = await taskPlanService.getItemPhotoPath(actor.companyId, parseId(req.params.id));
    res.sendFile(path.resolve(env.uploadPath, relativePath), (error) => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
}
