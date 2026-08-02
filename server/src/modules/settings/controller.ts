import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import * as settingsService from './service';
import { UpdateCompanySchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function getCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const company = await settingsService.getCompany(actor.companyId);
    sendSuccess(res, company, 'Company information retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function updateCompany(
  req: Request<Record<string, never>, unknown, UpdateCompanySchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    const company = await settingsService.updateCompany(actor.companyId, actor.id, req.body);
    sendSuccess(res, company, 'Company information updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    if (!req.file) {
      throw new AppError(400, 'A logo file is required.', [{ field: 'logo', message: 'A logo file is required.' }]);
    }

    const relativePath = path.relative(env.uploadPath, req.file.path).split(path.sep).join('/');
    const company = await settingsService.updateLogo(actor.companyId, actor.id, relativePath);
    sendSuccess(res, company, 'Company logo updated successfully.');
  } catch (error) {
    next(error);
  }
}
