import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedUser } from '../auth/types';
import * as rentDashboardService from './service';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const dashboard = await rentDashboardService.getDashboard(actor.companyId);
    sendSuccess(res, dashboard, 'Rent dashboard retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
