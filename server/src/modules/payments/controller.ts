import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import { parseId } from '../../utils/parseId';
import * as paymentsService from './service';
import { CreatePaymentSchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function listForOrder(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const payments = await paymentsService.list(actor.companyId, parseId(req.params.id));
    sendSuccess(res, payments, 'Payments retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function createForOrder(
  req: Request<{ id: string }, unknown, CreatePaymentSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const payment = await paymentsService.create(actor.companyId, actor.id, parseId(req.params.id), req.body);
    sendSuccess(res, payment, 'Payment recorded successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const payment = await paymentsService.getById(actor.companyId, parseId(req.params.id));
    sendSuccess(res, payment, 'Payment retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
