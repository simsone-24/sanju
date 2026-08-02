import { DocumentType } from '@prisma/client';

export interface UploadDocumentInput {
  documentType: DocumentType;
}

export interface UploadedFile {
  originalname: string;
  path: string;
}

export interface ListOrderDocumentsParams {
  companyId: string;
  orderId: string;
}
