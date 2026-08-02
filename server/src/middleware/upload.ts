import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// pdfkit can only embed JPEG/PNG, so images destined for a PDF (quotation decor samples) exclude WebP.
const PDF_SAFE_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, 'application/pdf'];

function createUploader(subfolder: string, maxSizeBytes: number, allowedMimeTypes: string[]) {
  const destination = path.join(env.uploadPath, subfolder);
  fs.mkdirSync(destination, { recursive: true });

  const storage = multer.diskStorage({
    destination,
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname);
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeBytes },
    fileFilter: (_req, file, callback) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        callback(new AppError(400, `Unsupported file type. Allowed: ${allowedMimeTypes.join(', ')}.`));
        return;
      }
      callback(null, true);
    },
  });
}

export function createImageUploader(subfolder: string, maxSizeBytes: number) {
  return createUploader(subfolder, maxSizeBytes, IMAGE_MIME_TYPES);
}

// JPEG/PNG only — for images that must render inside a generated PDF.
export function createPhotoUploader(subfolder: string, maxSizeBytes: number) {
  return createUploader(subfolder, maxSizeBytes, PDF_SAFE_IMAGE_TYPES);
}

export function createDocumentUploader(subfolder: string, maxSizeBytes: number) {
  return createUploader(subfolder, maxSizeBytes, DOCUMENT_MIME_TYPES);
}
