import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { parseQuery } from '../../utils/parseQuery';
import { sendSuccess } from '../../utils/response';
import { parseId } from '../../utils/parseId';
import * as tasksService from './service';
import { CreateOrderTaskSchema, UpdateOrderTaskSchema, listOrderTasksQuerySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function listForOrder(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const query = parseQuery(listOrderTasksQuerySchema, req.query);
    const tasks = await tasksService.list({
      companyId: actor.companyId,
      orderId: parseId(req.params.id),
      taskCategory: query.taskCategory,
    });
    sendSuccess(res, tasks, 'Tasks retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function createForOrder(
  req: Request<{ id: string }, unknown, CreateOrderTaskSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const task = await tasksService.create(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, task, 'Task created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request<{ id: string }, unknown, UpdateOrderTaskSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const task = await tasksService.update(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, task, 'Task updated successfully.');
  } catch (error) {
    next(error);
  }
}
