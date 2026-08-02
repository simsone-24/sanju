import { DocumentType } from '@prisma/client';
import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType),
});

export type UploadDocumentSchema = z.infer<typeof uploadDocumentSchema>;
