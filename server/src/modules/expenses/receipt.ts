import fs from 'fs/promises';
import path from 'path';
import { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';
import { ReceiptFile } from './types';

/** Upload-root-relative path with forward slashes, the form stored in `expense_receipts.file_path`. */
export function toReceiptFile(file: Express.Multer.File): ReceiptFile {
  return {
    originalname: file.originalname,
    path: path.relative(env.uploadPath, file.path).split(path.sep).join('/'),
  };
}

/** The receipts multer stored for this request (none when the request carried no files). */
export function uploadedReceipts(req: Request): ReceiptFile[] {
  return Array.isArray(req.files) ? req.files.map(toReceiptFile) : [];
}

export function resolveReceiptPath(relativePath: string): string {
  return path.resolve(env.uploadPath, relativePath);
}

/** Deletes a stored receipt. A file that is already gone is not an error; nothing else may escape. */
export async function removeReceiptFile(relativePath: string): Promise<void> {
  const root = path.resolve(env.uploadPath);
  const absolute = resolveReceiptPath(relativePath);
  if (!absolute.startsWith(root + path.sep)) return;

  try {
    await fs.unlink(absolute);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Failed to remove expense receipt file.', error);
    }
  }
}

/**
 * Router-level error middleware: multer writes the receipt to disk before validation and the
 * service run, so any failure after that point would leave an orphaned file behind.
 */
export async function discardReceiptOnError(
  error: unknown,
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  await Promise.all(uploadedReceipts(req).map((receipt) => removeReceiptFile(receipt.path)));
  next(error);
}
