import { Prisma, SequenceType } from '@prisma/client';
import * as ordersRepository from '../orders/repository';
import * as paymentTrackerRepository from '../payment-tracker/repository';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import * as paymentsRepository from './repository';
import { CreatePaymentInput } from './types';

// The order fields a payment is written against. Structural rather than the full order shape so
// both this module and the Payment Tracker can pass their own (differently selected) order object.
// The amounts accept a plain number as well as a Decimal so the tracker can validate against the
// budget it is about to write in the same request, before that value has come back from the DB.
export interface PayableOrder {
  id: number;
  orderNumber: string;
  totalAmount: Prisma.Decimal | number;
  paidAmount: Prisma.Decimal | number;
  pendingAmount: Prisma.Decimal | number;
}

export async function list(companyId: number, orderId: number) {
  const order = await ordersRepository.findOrderById(companyId, orderId);
  if (!order) throw new AppError(404, 'Order not found.');
  return paymentsRepository.listPaymentsForOrder(companyId, orderId);
}

export async function getById(companyId: number, id: number) {
  const payment = await paymentsRepository.findPaymentById(companyId, id);
  if (!payment) throw new AppError(404, 'Payment not found.');
  return payment;
}

/**
 * Every rule that can reject a collection, checked before anything is written. Exported so callers
 * composing a larger transaction (the Payment Tracker's edit, which may also change the budget in
 * the same request) can validate up front and never leave a half-applied edit behind.
 */
export function assertPaymentAllowed(order: PayableOrder, amount: number): void {
  const currentPending = Number(order.pendingAmount);
  // 02_BUSINESS_WORKFLOW.md §13 — "Payment cannot exceed total order amount."
  if (amount > currentPending) {
    throw new AppError(400, `Payment amount cannot exceed the pending amount (${currentPending}).`, [
      { field: 'amount', message: `Maximum payable amount is ${currentPending}.` },
    ]);
  }
}

/**
 * Writes one collection: the payment row, the parent order's running totals, and the Payment
 * Tracker's derived status — all against the caller's transaction so they land together. Callers
 * must have run `assertPaymentAllowed` first and generated the receipt number outside the
 * transaction.
 *
 * Deliberately does NOT touch Order.status. An order's status tracks the EVENT/work lifecycle and
 * is owned by the Orders module alone; how much has been collected is carried by the payment
 * status instead (see orders/service.ts's note on the payment-shaped statuses leaving the forward
 * chain). Money moving must never advance the work.
 */
export async function recordPayment(
  tx: PrismaClientOrTx,
  order: PayableOrder,
  actorId: number,
  input: CreatePaymentInput,
  receiptNumber: string,
) {
  const newPaidAmount = Number(order.paidAmount) + input.amount;
  const newPendingAmount = Number(order.totalAmount) - newPaidAmount;

  // Order updated BEFORE the payment is created: createPayment's select nests a fresh read of
  // the order, so it must already reflect the new amounts — otherwise (as caught in
  // orders/service.ts's convert()) the response would carry a stale pre-write snapshot.
  // Amounts only: `status` is intentionally absent, per the note above.
  await ordersRepository.updateOrder(
    order.id,
    { paidAmount: newPaidAmount, pendingAmount: newPendingAmount },
    tx,
  );

  const payment = await paymentsRepository.createPayment(
    {
      orderId: order.id,
      paymentDate: input.paymentDate ?? new Date(),
      paymentType: input.paymentType,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber,
      remarks: input.remarks,
      receivedById: actorId,
      receiptNumber,
    },
    tx,
  );

  // After createPayment: the tracker's Advance-vs-Partial rule counts the payment rows, so the new
  // one has to exist before the status is derived.
  await paymentTrackerRepository.syncTrackerStatus(order.id, Number(order.totalAmount), newPaidAmount, tx);

  return payment;
}

export async function create(companyId: number, actorId: number, orderId: number, input: CreatePaymentInput) {
  const order = await ordersRepository.findOrderById(companyId, orderId);
  if (!order) throw new AppError(404, 'Order not found.');

  assertPaymentAllowed(order, input.amount);

  const receiptNumber = await generateDocumentNumber(companyId, SequenceType.RECEIPT);
  const payment = await prisma.$transaction((tx) => recordPayment(tx, order, actorId, input, receiptNumber));

  await logActivity({
    companyId,
    module: 'PAYMENTS',
    referenceId: payment.id,
    action: 'CREATE',
    description: `Payment of ${input.amount} (${input.paymentType}) recorded for order "${order.orderNumber}" (receipt ${receiptNumber}).`,
    performedById: actorId,
  });

  return payment;
}
