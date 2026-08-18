export type DocumentType = 'QUOTATION_PDF' | 'RECEIPT' | 'AGREEMENT' | 'EVENT_PHOTO' | 'OTHER';

export interface OrderDocumentDetail {
  id: number;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  uploadedAt: string;
  uploadedBy: { id: number; fullName: string } | null;
}

export interface UploadDocumentInput {
  file: File;
  documentType: DocumentType;
}
