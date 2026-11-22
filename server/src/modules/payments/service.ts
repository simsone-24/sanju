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

/**
 * Deletes one payment (soft) and puts the order's money back the way it would be had the payment
 * never been taken: the order's paid / pending amounts are recomputed from the payments that remain,
 * and the Payment Tracker's derived status follows — all in one transaction, so the receipt and the
 * order's figures can never disagree.
 *
 * The amounts are recomputed from the remaining payments rather than reduced by this one, so they
 * stay right even if an earlier figure had drifted. A status the user pinned by hand is left as
 * pinned (see PaymentTracker.statusManual). The receipt number is not reused.
 */
export async function remove(companyId: number, actorId: number, id: number): Promise<void> {
  const payment = await paymentsRepository.findPaymentById(companyId, id);
  if (!payment) throw new AppError(404, 'Payment not found.');

  const { order } = payment;
  const totalAmount = Number(order.totalAmount);

  const { paidAmount, pendingAmount } = await prisma.$transaction(async (tx) => {
    await paymentsRepository.softDeletePayment(id, tx);

    const paid = await paymentsRepository.sumPaymentsForOrder(order.id, tx);
    const pending = totalAmount - paid;
    await ordersRepository.updateOrder(order.id, { paidAmount: paid, pendingAmount: pending }, tx);
    await paymentTrackerRepository.syncTrackerStatus(order.id, totalAmount, paid, tx);

    return { paidAmount: paid, pendingAmount: pending };
  });

  const amount = Number(payment.amount);

  // The record's own entry — what the Audit Log's Deleted Items reads the deleter from.
  await logActivity({
    companyId,
    module: 'PAYMENTS',
    referenceId: id,
    action: 'DELETE',
    description: `Payment of ${amount} (receipt ${payment.receiptNumber}) deleted from order "${order.orderNumber}".`,
    metadata: { orderId: order.id, amount, receiptNumber: payment.receiptNumber },
    performedById: actorId,
  });

  // And one on the order, so its Timeline tab shows why the collected figure went down.
  await logActivity({
    companyId,
    module: 'ORDERS',
    referenceId: order.id,
    action: 'UPDATE',
    description: `Payment of ${amount} (receipt ${payment.receiptNumber}) deleted; collected is now ${paidAmount} and ${pendingAmount} is pending.`,
    metadata: { paymentId: id, amount, paidAmount, pendingAmount },
    performedById: actorId,
  });
}

/**
 * The money side of restoring one payment, on the caller's transaction: refuses if the order would end
 * up collected beyond its budget, otherwise brings the payment back, recomputes the order's paid /
 * pending amounts from the payments that then exist and lets the Payment Tracker's status follow.
 * Exported so the whole sequence can be exercised in a transaction that is rolled back.
 */
export async function restorePaymentInTransaction(
  tx: PrismaClientOrTx,
  order: { id: number; totalAmount: Prisma.Decimal | number },
  paymentId: number,
  amount: number,
): Promise<{ paidAmount: number; pendingAmount: number }> {
  const totalAmount = Number(order.totalAmount);
  const collectedNow = await paymentsRepository.sumPaymentsForOrder(order.id, tx);
  const paid = collectedNow + amount;
  if (paid > totalAmount) {
    throw new AppError(
      409,
      `Restoring this payment would bring the collected amount to ${paid}, above the order's budget of ${totalAmount}.`,
    );
  }

  await paymentsRepository.restorePayment(paymentId, tx);
  const pending = totalAmount - paid;
  await ordersRepository.updateOrder(order.id, { paidAmount: paid, pendingAmount: pending }, tx);
  await paymentTrackerRepository.syncTrackerStatus(order.id, totalAmount, paid, tx);

  return { paidAmount: paid, pendingAmount: pending };
}

/**
 * Brings a deleted payment back and puts the order's money back with it: the paid / pending amounts
 * are recomputed from the payments that then exist and the Payment Tracker's status follows, in one
 * transaction — the inverse of `remove`.
 *
 * Refused while the payment's order is itself deleted (restore the order, which brings its payments
 * back), and when taking the payment back would collect more than the order's budget — the budget may
 * have been lowered since, and an order cannot be paid beyond what it is worth.
 */
export async function restore(companyId: number, actorId: number, id: number): Promise<void> {
  const deleted = await paymentsRepository.findDeletedPaymentById(companyId, id);
  if (!deleted) throw new AppError(404, 'Deleted payment not found.');

  const { order } = deleted;
  if (order.deletedAt) {
    throw new AppError(
      409,
      `Its order ${order.orderNumber} is deleted. Restore the order first — that brings its payments back too.`,
    );
  }

  const amount = Number(deleted.amount);

  const { paidAmount, pendingAmount } = await prisma.$transaction((tx) =>
    restorePaymentInTransaction(tx, order, id, amount),
  );

  await logActivity({
    companyId,
    module: 'PAYMENTS',
    referenceId: id,
    action: 'RESTORE',
    description: `Payment of ${amount} (receipt ${deleted.receiptNumber}) restored to order "${order.orderNumber}".`,
    metadata: { orderId: order.id, amount, receiptNumber: deleted.receiptNumber },
    performedById: actorId,
  });

  await logActivity({
    companyId,
    module: 'ORDERS',
    referenceId: order.id,
    action: 'UPDATE',
    description: `Payment of ${amount} (receipt ${deleted.receiptNumber}) restored; collected is now ${paidAmount} and ${pendingAmount} is pending.`,
    metadata: { paymentId: id, amount, paidAmount, pendingAmount },
    performedById: actorId,
  });
}
