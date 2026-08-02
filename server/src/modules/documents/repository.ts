import { Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';

const documentSelect = {
  id: true,
  documentType: true,
  fileName: true,
  filePath: true,
  uploadedAt: true,
  uploadedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.OrderDocumentSelect;

const documentDetailSelect = {
  ...documentSelect,
  order: { select: { id: true, orderNumber: true, companyId: true } },
} satisfies Prisma.OrderDocumentSelect;

export function listDocumentsForOrder(companyId: string, orderId: string) {
  return prisma.orderDocument.findMany({
    where: { orderId, deletedAt: null, order: { companyId } },
    select: documentSelect,
    orderBy: { uploadedAt: 'desc' },
  });
}

export function findDocumentById(companyId: string, id: string, client: PrismaClientOrTx = prisma) {
  return client.orderDocument.findFirst({
    where: { id, deletedAt: null, order: { companyId } },
    select: documentDetailSelect,
  });
}

export function createDocument(data: Prisma.OrderDocumentUncheckedCreateInput, client: PrismaClientOrTx = prisma) {
  return client.orderDocument.create({ data, select: documentSelect });
}

export function softDeleteDocument(id: string, client: PrismaClientOrTx = prisma) {
  return client.orderDocument.update({ where: { id }, data: { deletedAt: new Date() } });
}
