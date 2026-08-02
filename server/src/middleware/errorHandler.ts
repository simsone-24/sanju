import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/response';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.errors);
    return;
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : 'File upload error.';
    sendError(res, 400, message);
    return;
  }

  console.error(err);
  sendError(res, 500, 'Something went wrong.');
}
