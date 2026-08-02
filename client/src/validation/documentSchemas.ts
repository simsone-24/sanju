import { z } from 'zod';

const DOCUMENT_TYPE_VALUES = ['QUOTATION_PDF', 'RECEIPT', 'AGREEMENT', 'EVENT_PHOTO', 'OTHER'] as const;

export const uploadDocumentSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPE_VALUES),
});

export type UploadDocumentFormValues = z.infer<typeof uploadDocumentSchema>;
