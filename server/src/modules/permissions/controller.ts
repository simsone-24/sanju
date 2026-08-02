import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as permissionsService from './service';

export function getCatalog(_req: Request, res: Response, next: NextFunction): void {
  try {
    sendSuccess(res, permissionsService.getCatalog(), 'Permission catalog retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
