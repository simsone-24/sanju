import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import * as authService from './service';
import { ChangePasswordSchema, LoginSchema, RefreshTokenSchema, UpdateProfileSchema } from './validation';

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

export async function updateProfile(
  req: Request<Record<string, never>, unknown, UpdateProfileSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required.');
    const profile = await authService.updateProfile(req.user.id, req.body);
    sendSuccess(res, profile, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function uploadProfilePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required.');
    if (!req.file) {
      throw new AppError(400, 'A photo file is required.', [
        { field: 'photo', message: 'A photo file is required.' },
      ]);
    }

    const relativePath = path.relative(env.uploadPath, req.file.path).split(path.sep).join('/');
    const profile = await authService.updateProfilePhoto(req.user.id, relativePath);
    sendSuccess(res, profile, 'Profile photo updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function getProfilePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required.');
    const relativePath = await authService.getOwnProfilePhotoPath(req.user.id);
    res.sendFile(path.resolve(env.uploadPath, relativePath), (error) => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request<Record<string, never>, unknown, ChangePasswordSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required.');
    await authService.changePassword(req.user.id, {
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    sendSuccess(res, null, 'Password changed successfully.');
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
