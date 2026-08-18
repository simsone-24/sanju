import { SequenceType } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import * as stockOutsService from '../rent-stock-outs/service';
import { roundCurrency } from '../rent-stock-outs/status';
import { assertWithinBalance, writePayment } from './inline';
import * as paymentsRepository from './repository';
import { CreateRentPaymentInput, ListRentPaymentsParams, UpdateRentPaymentInput } from './types';

const MODULE = 'RENT';

export interface RentPaymentResponse {
  id: number;
  paymentNo: string;
  paymentDate: Date;
  amount: number;
  paymentMode: string;
  referenceNo: string | null;
  notes: string | null;
  createdAt: Date;
  receivedBy: { id: number; fullName: string } | null;
  rentalPerson: { id: number; name: string; phone: string };
  stockOut: {
    id: number;
    rentNo: string;
    stockOutDate: Date;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    paymentStatus: string;
  };
}

export function mapRentPayment(record: paymentsRepository.RentPaymentRecord): RentPaymentResponse {
  const grandTotal = Number(record.stockOut.grandTotal);
  const paidAmount = Number(record.stockOut.paidAmount);

  return {
    id: record.id,
    paymentNo: record.paymentNo,
    paymentDate: record.paymentDate,
    amount: Number(record.amount),
    paymentMode: record.paymentMode,
    referenceNo: record.referenceNo,
    notes: record.notes,
    createdAt: record.createdAt,
    receivedBy: record.receivedBy,
    rentalPerson: record.rentalPerson,
    stockOut: {
      id: record.stockOut.id,
      rentNo: record.stockOut.rentNo,
      stockOutDate: record.stockOut.stockOutDate,
      grandTotal,
      paidAmount,
      balanceAmount: roundCurrency(grandTotal - paidAmount),
      paymentStatus: record.stockOut.paymentStatus,
    },
  };
}

export async function list(params: ListRentPaymentsParams) {
  const { records, totalRecords } = await paymentsRepository.listRentPayments(params);
  return {
    records: records.map(mapRentPayment),
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}

export async function getById(companyId: number, id: number): Promise<RentPaymentResponse> {
  const record = await paymentsRepository.findRentPaymentById(companyId, id);
  if (!record) throw new AppError(404, 'Payment not found.');
  return mapRentPayment(record);
}

export function getSummary(companyId: number) {
  return paymentsRepository.getPaymentSummary(companyId);
}

export async function create(
  companyId: number,
  actorId: number,
  input: CreateRentPaymentInput,
): Promise<RentPaymentResponse> {
  const stockOut = await stockOutsService.getWritableCore(companyId, input.stockOutId);

  // stock.md §31 — the payment must belong to the selected stock out AND the selected person.
  if (stockOut.rentalPersonId !== input.rentalPersonId) {
    throw new AppError(400, `"${stockOut.rentNo}" does not belong to the selected rental person.`, [
      { field: 'rentalPersonId', message: 'This stock out belongs to a different rental person.' },
    ]);
  }

  const amount = roundCurrency(input.amount);
  const paymentNo = await generateDocumentNumber(companyId, SequenceType.RENT_PAYMENT);

  const createdId = await prisma.$transaction(async (tx) => {
    const paymentId = await writePayment(tx, {
      companyId,
      stockOutId: stockOut.id,
      rentalPersonId: stockOut.rentalPersonId,
      rentNo: stockOut.rentNo,
      actorId,
      paymentNo,
      input: { ...input, amount },
    });

    await stockOutsService.recalculate(tx, stockOut.id);
    return paymentId;
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: stockOut.id,
    action: 'PAYMENT',
    description: `Payment "${paymentNo}" of ${amount} (${input.paymentMode}) recorded against "${stockOut.rentNo}".`,
    performedById: actorId,
    metadata: { rentPaymentId: createdId, paymentNo },
  });

  return getById(companyId, createdId);
}

export async function update(
  companyId: number,
  actorId: number,
  id: number,
  input: UpdateRentPaymentInput,
): Promise<RentPaymentResponse> {
  const existing = await paymentsRepository.findRentPaymentById(companyId, id);
  if (!existing) throw new AppError(404, 'Payment not found.');

  const stockOut = await stockOutsService.getWritableCore(companyId, existing.stockOut.id);
  const amount = input.amount === undefined ? Number(existing.amount) : roundCurrency(input.amount);

  await prisma.$transaction(async (tx) => {
    // Measured against the balance as it stands WITHOUT this payment, so raising a receipt from
    // 500 to 800 is checked against the room 800 needs, not against what is left after the 500.
    await assertWithinBalance(tx, stockOut.id, stockOut.rentNo, amount, Number(existing.amount));

    await paymentsRepository.updateRentPayment(
      id,
      {
        paymentDate: input.paymentDate,
        amount,
        paymentMode: input.paymentMode,
        referenceNo: input.referenceNo,
        notes: input.notes,
      },
      tx,
    );

    await stockOutsService.recalculate(tx, stockOut.id);
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: stockOut.id,
    action: 'PAYMENT_UPDATE',
    description: `Payment "${existing.paymentNo}" on "${stockOut.rentNo}" updated to ${amount}.`,
    performedById: actorId,
    metadata: { rentPaymentId: id },
  });

  return getById(companyId, id);
}

export async function remove(companyId: number, actorId: number, id: number): Promise<void> {
  const existing = await paymentsRepository.findRentPaymentById(companyId, id);
  if (!existing) throw new AppError(404, 'Payment not found.');

  const stockOutId = existing.stockOut.id;

  await prisma.$transaction(async (tx) => {
    await paymentsRepository.softDeleteRentPayment(id, tx);
    await stockOutsService.recalculate(tx, stockOutId);
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: stockOutId,
    action: 'PAYMENT_DELETE',
    description: `Payment "${existing.paymentNo}" of ${Number(existing.amount)} on "${existing.stockOut.rentNo}" deleted.`,
    performedById: actorId,
    metadata: { rentPaymentId: id },
  });
}
