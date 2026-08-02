import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import * as documentsService from './service';
import { UploadDocumentSchema } from './validation';

function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new AppError(401, 'Authentication required.');
  return req.user;
}

export async function listForOrder(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const documents = await documentsService.list({ companyId: actor.companyId, orderId: req.params.id });
    sendSuccess(res, documents, 'Documents retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

export async function uploadForOrder(
  req: Request<{ id: string }, unknown, UploadDocumentSchema>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const actor = requireUser(req);
    if (!req.file) {
      throw new AppError(400, 'A file is required.', [{ field: 'file', message: 'A file is required.' }]);
    }

    const relativePath = path.relative(env.uploadPath, req.file.path).split(path.sep).join('/');
    const document = await documentsService.upload(actor.companyId, actor.id, req.params.id, req.body, {
      originalname: req.file.originalname,
      path: relativePath,
    });
    sendSuccess(res, document, 'Document uploaded successfully.', 201);
  } catch (error) {
    next(error);
  }
}

// Authenticated + company-scoped, unlike the logo — order documents can hold private
// business/PII data and are never served via the public static route.
export async function downloadFile(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    const { filePath, fileName } = await documentsService.getFileForDownload(actor.companyId, req.params.id);
    const absolutePath = path.resolve(env.uploadPath, filePath);
    res.download(absolutePath, fileName, (error) => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = requireUser(req);
    await documentsService.remove(actor.companyId, actor.id, req.params.id);
    sendSuccess(res, null, 'Document deleted successfully.');
  } catch (error) {
    next(error);
  }
}
