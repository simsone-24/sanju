import { PaymentType, Prisma, SequenceType } from '@prisma/client';
import * as ordersRepository from '../orders/repository';
import * as paymentsService from '../payments/service';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import * as paymentTrackerRepository from './repository';
import { ListPaymentTrackerParams, PaymentTrackerStatsParams, UpdatePaymentTrackerInput } from './types';

export async function list(params: ListPaymentTrackerParams) {
  const { records, totalRecords } = await paymentTrackerRepository.listPaymentTrackers(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export function stats(params: PaymentTrackerStatsParams) {
  return paymentTrackerRepository.getPaymentTrackerStats(params);
}

// §Financial Summary lists Advance Amount beside the running total, so it is summed from the
// receipts rather than stored — the payment rows are the only place that distinction lives.
function sumAdvance(payments: { paymentType: PaymentType; amount: Prisma.Decimal }[]): number {
  return payments
    .filter((payment) => payment.paymentType === PaymentType.ADVANCE)
    .reduce((total, payment) => total + Number(payment.amount), 0);
}

export async function getByOrderId(companyId: number, orderId: number) {
  const order = await paymentTrackerRepository.findTrackerOrderById(companyId, orderId);
  if (!order) throw new AppError(404, 'Payment tracker record not found.');

  return { ...order, advanceAmount: sumAdvance(order.payments) };
}

export async function getHistory(companyId: number, orderId: number) {
  const order = await paymentTrackerRepository.findTrackerOrderById(companyId, orderId);
  if (!order) throw new AppError(404, 'Payment tracker record not found.');

  return order.payments;
}

// The tracker's Collected box asks only for an amount, method and date, so the payment's type is
// classified from where the order stands: the opening collection is the advance, one that clears
// the remaining balance is the final settlement, anything between is a part payment.
function resolvePaymentType(collectedSoFar: number, pendingBefore: number, amount: number): PaymentType {
  if (collectedSoFar <= 0) return PaymentType.ADVANCE;
  if (amount >= pendingBefore) return PaymentType.FINAL;
  return PaymentType.PARTIAL;
}

/**
 * §Edit Payment — budget, a collection to record, the payment status and remarks, in one request.
 *
 * Every rule is checked before the first write, then all writes share a single transaction, so a
 * request that changes the budget AND records a collection can never apply one without the other.
 */
export async function update(
  companyId: number,
  actorId: number,
  orderId: number,
  input: UpdatePaymentTrackerInput,
) {
  const order = await paymentTrackerRepository.findTrackerOrderById(companyId, orderId);
  if (!order) throw new AppError(404, 'Payment tracker record not found.');

  const currentBudget = Number(order.totalAmount);
  const collectedSoFar = Number(order.paidAmount);
  const budgetChanged = input.budgetAmount !== undefined && input.budgetAmount !== currentBudget;
  const nextBudget = input.budgetAmount ?? currentBudget;
  const pendingAfterBudget = nextBudget - collectedSoFar;

  // ---- validation, all of it, before anything is written ----
  if (budgetChanged) {
    if (nextBudget < collectedSoFar) {
      throw new AppError(400, `The budget cannot be less than the ${collectedSoFar} already collected.`, [
        { field: 'budgetAmount', message: `Budget must be at least ${collectedSoFar}.` },
      ]);
    }
  }

  if (input.collected) {
    // Validated against the budget this request is about to set, not the stored one, so raising the
    // budget and collecting against the new headroom works in a single save.
    paymentsService.assertPaymentAllowed(
      { ...order, totalAmount: nextBudget, pendingAmount: pendingAfterBudget },
      input.collected.amount,
    );
  }

  // Receipt numbers come from their own atomic counter and must not be drawn inside the
  // transaction below — see numberGenerator.ts.
  const receiptNumber = input.collected ? await generateDocumentNumber(companyId, SequenceType.RECEIPT) : null;
  const paymentType = input.collected
    ? resolvePaymentType(collectedSoFar, pendingAfterBudget, input.collected.amount)
    : null;

  await prisma.$transaction(async (tx) => {
    if (budgetChanged) {
      await ordersRepository.updateOrder(
        orderId,
        { totalAmount: nextBudget, pendingAmount: pendingAfterBudget },
        tx,
      );
      // A raised budget can move a settled order back to part-paid, so the derived status has to
      // follow the new figure even when no money moved.
      await paymentTrackerRepository.syncTrackerStatus(orderId, nextBudget, collectedSoFar, tx);
    }

    if (input.collected && receiptNumber && paymentType) {
      await paymentsService.recordPayment(
        tx,
        { ...order, totalAmount: nextBudget, pendingAmount: pendingAfterBudget },
        actorId,
        {
          amount: input.collected.amount,
          paymentMethod: input.collected.paymentMethod,
          paymentDate: input.collected.paymentDate,
          referenceNumber: input.collected.referenceNumber,
          paymentType,
        },
        receiptNumber,
      );
    }

    await paymentTrackerRepository.ensureTracker(orderId, tx);

    // Status and remarks are written last: recordPayment above recalculates the derived status, and
    // a status the user pinned in this same request has to survive that.
    if (input.paymentStatus === null) {
      await paymentTrackerRepository.updateTracker(orderId, { statusManual: false }, tx);
      const finalCollected = collectedSoFar + (input.collected?.amount ?? 0);
      await paymentTrackerRepository.syncTrackerStatus(orderId, nextBudget, finalCollected, tx);
    } else if (input.paymentStatus !== undefined) {
      await paymentTrackerRepository.updateTracker(
        orderId,
        { paymentStatus: input.paymentStatus, statusManual: true },
        tx,
      );
    }

    if (input.remarks !== undefined) {
      await paymentTrackerRepository.updateTracker(orderId, { remarks: input.remarks || null }, tx);
    }
  });

  // Logged per change rather than as one lump so the audit trail names what actually moved
  // (CLAUDE.md §Logging: Update, Payment, Status Change).
  if (budgetChanged) {
    await logActivity({
      companyId,
      module: 'PAYMENT_TRACKER',
      referenceId: orderId,
      action: 'UPDATE',
      description: `Budget for order "${order.orderNumber}" changed from ${currentBudget} to ${nextBudget}.`,
      performedById: actorId,
    });
  }

  if (input.collected && receiptNumber) {
    await logActivity({
      companyId,
      module: 'PAYMENT_TRACKER',
      referenceId: orderId,
      action: 'PAYMENT',
      description: `Collected ${input.collected.amount} (${paymentType}) via ${input.collected.paymentMethod} for order "${order.orderNumber}" (receipt ${receiptNumber}).`,
      performedById: actorId,
    });
  }

  if (input.paymentStatus !== undefined) {
    await logActivity({
      companyId,
      module: 'PAYMENT_TRACKER',
      referenceId: orderId,
      action: 'STATUS_CHANGE',
      description:
        input.paymentStatus === null
          ? `Payment status for order "${order.orderNumber}" returned to automatic.`
          : `Payment status for order "${order.orderNumber}" set to ${input.paymentStatus} manually.`,
      performedById: actorId,
    });
  }

  return getByOrderId(companyId, orderId);
}
