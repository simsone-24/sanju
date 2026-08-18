import { RentPaymentMode } from '@prisma/client';
import { PrismaClientOrTx } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import * as stockOutsRepository from '../rent-stock-outs/repository';
import { roundCurrency } from '../rent-stock-outs/status';
import * as paymentsRepository from './repository';

/**
 * Writing a rent collection from inside somebody else's transaction.
 *
 * Three screens can take money: the Payments module itself, the initial payment on a new stock out,
 * and the collection booked alongside a return. All three must apply the same balance rule and
 * write the same row, so the rule and the write live here rather than being restated per caller.
 *
 * Deliberately imports no service — only repositories and the shared arithmetic. The Payments and
 * Stock Out services both depend on this file, and both are depended on by the other's callers, so
 * putting it in either service would make the two import each other in a cycle.
 */

export interface InlinePaymentInput {
  amount: number;
  paymentMode: RentPaymentMode;
  paymentDate?: Date;
  referenceNo?: string;
  notes?: string;
}

/**
 * stock.md §22 — a collection may not exceed what is still outstanding.
 *
 * The project has no overpayment or refund workflow anywhere (Orders applies the same rule in
 * payments/service.ts assertPaymentAllowed), so the excess is refused rather than parked as a
 * credit nothing would ever draw down. `excludeAmount` lets an edit measure the balance as it would
 * be without the payment being changed.
 *
 * Reads through the caller's transaction client, so a collection raced against another one is
 * checked against what the database actually holds rather than a snapshot taken beforehand.
 */
export async function assertWithinBalance(
  tx: PrismaClientOrTx,
  stockOutId: number,
  rentNo: string,
  amount: number,
  excludeAmount = 0,
): Promise<void> {
  const [totals, paidSoFar] = await Promise.all([
    stockOutsRepository.findStockOutGrandTotal(stockOutId, tx),
    stockOutsRepository.sumPaymentsForStockOut(stockOutId, tx),
  ]);
  if (!totals) throw new AppError(404, 'Stock out not found.');

  const outstanding = roundCurrency(Number(totals.grandTotal) - roundCurrency(paidSoFar - excludeAmount));

  if (amount > outstanding) {
    throw new AppError(400, `Payment cannot exceed the outstanding balance of ${outstanding} on "${rentNo}".`, [
      { field: 'amount', message: `Maximum payable amount is ${outstanding}.` },
    ]);
  }
}

interface WritePaymentParams {
  companyId: number;
  stockOutId: number;
  rentalPersonId: number;
  rentNo: string;
  actorId: number;
  /** Allocated by the caller outside the transaction — see generateDocumentNumber. */
  paymentNo: string;
  input: InlinePaymentInput;
}

/**
 * Checks the balance and writes the payment row. Does NOT recalculate the stock out's caches: the
 * caller decides when to do that, so a transaction writing several things recalculates once at the
 * end rather than after each step.
 */
export async function writePayment(tx: PrismaClientOrTx, params: WritePaymentParams): Promise<number> {
  const amount = roundCurrency(params.input.amount);
  await assertWithinBalance(tx, params.stockOutId, params.rentNo, amount);

  const payment = await paymentsRepository.createRentPayment(
    {
      companyId: params.companyId,
      paymentNo: params.paymentNo,
      stockOutId: params.stockOutId,
      rentalPersonId: params.rentalPersonId,
      paymentDate: params.input.paymentDate ?? new Date(),
      amount,
      paymentMode: params.input.paymentMode,
      referenceNo: params.input.referenceNo,
      notes: params.input.notes,
      receivedById: params.actorId,
    },
    tx,
  );

  return payment.id;
}
