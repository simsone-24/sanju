import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import * as authService from './service';
import { LoginSchema, RefreshTokenSchema } from './validation';

export async function login(
  req: Request<Record<string, never>, unknown, LoginSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful.');
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(
  req: Request<Record<string, never>, unknown, RefreshTokenSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    sendSuccess(res, result, 'Token refreshed.');
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required.');
    const profile = await authService.me(req.user.id);
    sendSuccess(res, profile, 'Current user retrieved.');
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required.');
    await authService.logout(req.user.id, req.user.companyId);
    sendSuccess(res, null, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
}
