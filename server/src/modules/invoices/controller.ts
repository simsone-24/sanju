import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import * as invoicesService from './service';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function getForOrder(req: Request<{ orderId: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const invoice = await invoicesService.getForOrder(actor.companyId, actor.id, req.params.orderId);
    sendSuccess(res, invoice, 'Invoice retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
