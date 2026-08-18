import * as ordersRepository from '../orders/repository';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import * as documentsRepository from './repository';
import { ListOrderDocumentsParams, UploadDocumentInput, UploadedFile } from './types';

export async function list(params: ListOrderDocumentsParams) {
  const order = await ordersRepository.findOrderById(params.companyId, params.orderId);
  if (!order) throw new AppError(404, 'Order not found.');
  return documentsRepository.listDocumentsForOrder(params.companyId, params.orderId);
}

export async function upload(
  companyId: number,
  actorId: number,
  orderId: number,
  input: UploadDocumentInput,
  file: UploadedFile,
) {
  const order = await ordersRepository.findOrderById(companyId, orderId);
  if (!order) throw new AppError(404, 'Order not found.');

  const document = await documentsRepository.createDocument({
    orderId,
    documentType: input.documentType,
    fileName: file.originalname,
    filePath: file.path,
    uploadedById: actorId,
  });

  await logActivity({
    companyId,
    module: 'ORDERS',
    referenceId: orderId,
    action: 'CREATE',
    description: `Document "${document.fileName}" (${input.documentType}) uploaded to order "${order.orderNumber}".`,
    performedById: actorId,
  });

  return document;
}

export async function getFileForDownload(companyId: number, id: number) {
  const document = await documentsRepository.findDocumentById(companyId, id);
  if (!document) throw new AppError(404, 'Document not found.');
  return { filePath: document.filePath, fileName: document.fileName };
}

export async function remove(companyId: number, actorId: number, id: number): Promise<void> {
  const document = await documentsRepository.findDocumentById(companyId, id);
  if (!document) throw new AppError(404, 'Document not found.');

  await documentsRepository.softDeleteDocument(id);

  await logActivity({
    companyId,
    module: 'ORDERS',
    referenceId: document.order.id,
    action: 'DELETE',
    description: `Document "${document.fileName}" deleted.`,
    performedById: actorId,
  });
}
