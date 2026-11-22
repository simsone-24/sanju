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

export function listPaymentsForOrder(companyId: number, orderId: number) {
  return prisma.payment.findMany({
    where: { orderId, deletedAt: null, order: { companyId } },
    select: paymentSelect,
    orderBy: { paymentDate: 'desc' },
  });
}

export function findPaymentById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.payment.findFirst({
    where: { id, deletedAt: null, order: { companyId, deletedAt: null } },
    select: paymentDetailSelect,
  });
}

export function createPayment(data: Prisma.PaymentUncheckedCreateInput, client: PrismaClientOrTx = prisma) {
  return client.payment.create({ data, select: paymentDetailSelect });
}

/** Whether an order already has its opening advance — the guard that keeps the enquiry's advance
 *  from being carried across a second time (orders/service.ts syncOrderFromEnquiry). */
export function countAdvancePayments(orderId: number, client: PrismaClientOrTx = prisma) {
  return client.payment.count({
    where: { orderId, deletedAt: null, paymentType: PaymentType.ADVANCE },
  });
}

export function softDeletePayment(id: number, client: PrismaClientOrTx = prisma) {
  return client.payment.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true } });
}

/** What an order has actually been paid: the sum of its live payments. */
export async function sumPaymentsForOrder(orderId: number, client: PrismaClientOrTx = prisma): Promise<number> {
  const result = await client.payment.aggregate({
    where: { orderId, deletedAt: null },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

/** A payment that has been soft-deleted, with the order it belongs to — what a restore checks first. */
export function findDeletedPaymentById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.payment.findFirst({
    where: { id, deletedAt: { not: null }, order: { companyId } },
    select: {
      id: true,
      receiptNumber: true,
      amount: true,
      order: { select: { id: true, orderNumber: true, totalAmount: true, deletedAt: true } },
    },
  });
}

export function restorePayment(id: number, client: PrismaClientOrTx = prisma) {
  return client.payment.update({ where: { id }, data: { deletedAt: null }, select: { id: true } });
}
