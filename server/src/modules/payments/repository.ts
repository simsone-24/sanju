import { PaymentType, Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';

const paymentSelect = {
  id: true,
  paymentDate: true,
  paymentType: true,
  amount: true,
  paymentMethod: true,
  referenceNumber: true,
  remarks: true,
  receiptNumber: true,
  createdAt: true,
  receivedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.PaymentSelect;

const paymentDetailSelect = {
  ...paymentSelect,
  order: {
    select: { id: true, orderNumber: true, totalAmount: true, paidAmount: true, pendingAmount: true },
  },
} satisfies Prisma.PaymentSelect;

export function listPaymentsForOrder(companyId: string, orderId: string) {
  return prisma.payment.findMany({
    where: { orderId, deletedAt: null, order: { companyId } },
    select: paymentSelect,
    orderBy: { paymentDate: 'desc' },
  });
}

export function findPaymentById(companyId: string, id: string, client: PrismaClientOrTx = prisma) {
  return client.payment.findFirst({
    where: { id, deletedAt: null, order: { companyId } },
    select: paymentDetailSelect,
  });
}

export function createPayment(data: Prisma.PaymentUncheckedCreateInput, client: PrismaClientOrTx = prisma) {
  return client.payment.create({ data, select: paymentDetailSelect });
}

/** Whether an order already has its opening advance — the guard that keeps the enquiry's advance
 *  from being carried across a second time (orders/service.ts syncOrderFromEnquiry). */
export function countAdvancePayments(orderId: string, client: PrismaClientOrTx = prisma) {
  return client.payment.count({
    where: { orderId, deletedAt: null, paymentType: PaymentType.ADVANCE },
  });
}
