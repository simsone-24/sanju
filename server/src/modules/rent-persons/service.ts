import { RentalPersonStatus } from '@prisma/client';
import { PrismaClientOrTx } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { buildPaginationMeta } from '../../utils/pagination';
import * as rentPersonsRepository from './repository';
import { CreateRentalPersonInput, ListRentalPersonsParams, UpdateRentalPersonInput } from './types';

const MODULE = 'RENT';

export interface RentalPersonSummary extends rentPersonsRepository.RentalPersonRecord {
  stockOutCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

/**
 * The list every rent screen selects a person from, each row carrying its own outstanding position
 * ("md files/Stock/stock.md" §24). Totals are aggregated for the current page in one query rather
 * than per row.
 */
export async function list(params: ListRentalPersonsParams) {
  const { records, totalRecords } = await rentPersonsRepository.listRentalPersons(params);

  const totalsByPerson = new Map(
    (await rentPersonsRepository.sumStockOutTotalsByPerson(
      params.companyId,
      records.map((record) => record.id),
    )).map((row) => [row.rentalPersonId, row]),
  );

  const summaries: RentalPersonSummary[] = records.map((record) => {
    const totals = totalsByPerson.get(record.id);
    const totalAmount = totals?.totalAmount ?? 0;
    const paidAmount = totals?.paidAmount ?? 0;
    return {
      ...record,
      stockOutCount: totals?.stockOutCount ?? 0,
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
    };
  });

  return { records: summaries, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export async function getById(companyId: number, id: number): Promise<RentalPersonSummary> {
  const person = await rentPersonsRepository.findRentalPersonById(companyId, id);
  if (!person) throw new AppError(404, 'Rental person not found.');

  const [totals] = await rentPersonsRepository.sumStockOutTotalsByPerson(companyId, [id]);
  const totalAmount = totals?.totalAmount ?? 0;
  const paidAmount = totals?.paidAmount ?? 0;

  return {
    ...person,
    stockOutCount: totals?.stockOutCount ?? 0,
    totalAmount,
    paidAmount,
    pendingAmount: totalAmount - paidAmount,
  };
}

/**
 * Resolves the person a rent transaction is being written against.
 *
 * stock.md §5 — an inactive person cannot be picked for a NEW transaction, but their existing
 * history stays fully accessible, so this guard belongs on the write path only and never on a read.
 */
export async function assertSelectableForStockOut(
  companyId: number,
  rentalPersonId: number,
  client?: PrismaClientOrTx,
) {
  const person = await rentPersonsRepository.findRentalPersonById(companyId, rentalPersonId, client);
  if (!person) {
    throw new AppError(404, 'Rental person not found.', [
      { field: 'rentalPersonId', message: 'Select a rental person.' },
    ]);
  }
  if (person.status === RentalPersonStatus.INACTIVE) {
    throw new AppError(400, `"${person.name}" is inactive and cannot be selected for a new stock out.`, [
      { field: 'rentalPersonId', message: 'This rental person is inactive.' },
    ]);
  }
  return person;
}

export async function create(companyId: number, actorId: number, input: CreateRentalPersonInput) {
  const duplicate = await rentPersonsRepository.findRentalPersonByPhone(companyId, input.phone);
  if (duplicate) {
    throw new AppError(409, `"${duplicate.name}" is already registered with this phone number.`, [
      { field: 'phone', message: 'Phone number is already in use.' },
    ]);
  }

  const person = await rentPersonsRepository.createRentalPerson({
    companyId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    address: input.address,
    city: input.city,
    notes: input.notes,
    status: RentalPersonStatus.ACTIVE,
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: person.id,
    action: 'CREATE',
    description: `Rental person "${person.name}" created.`,
    performedById: actorId,
  });

  return person;
}

export async function update(companyId: number, actorId: number, id: number, input: UpdateRentalPersonInput) {
  const existing = await rentPersonsRepository.findRentalPersonById(companyId, id);
  if (!existing) throw new AppError(404, 'Rental person not found.');

  if (input.phone && input.phone !== existing.phone) {
    const duplicate = await rentPersonsRepository.findRentalPersonByPhone(companyId, input.phone);
    if (duplicate && duplicate.id !== id) {
      throw new AppError(409, `"${duplicate.name}" is already registered with this phone number.`, [
        { field: 'phone', message: 'Phone number is already in use.' },
      ]);
    }
  }

  const person = await rentPersonsRepository.updateRentalPerson(id, {
    name: input.name,
    phone: input.phone,
    email: input.email,
    address: input.address,
    city: input.city,
    notes: input.notes,
    status: input.status,
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: person.id,
    action: 'UPDATE',
    description: `Rental person "${person.name}" updated.`,
    performedById: actorId,
  });

  return person;
}

/**
 * Soft-deletes a rental person who has no rent history.
 *
 * A person with stock outs is refused rather than hidden: stock.md §33 requires historical records
 * to stay auditable, and a deleted person would leave every one of their transactions pointing at a
 * name the UI can no longer resolve. Deactivating them (status = INACTIVE) is the supported way to
 * take someone out of circulation.
 */
export async function remove(companyId: number, actorId: number, id: number): Promise<void> {
  const existing = await rentPersonsRepository.findRentalPersonById(companyId, id);
  if (!existing) throw new AppError(404, 'Rental person not found.');

  const stockOutCount = await rentPersonsRepository.countStockOutsForPerson(id);
  if (stockOutCount > 0) {
    throw new AppError(
      409,
      `Cannot delete "${existing.name}" — ${stockOutCount} stock out transaction(s) belong to them. Mark them inactive instead.`,
    );
  }

  await rentPersonsRepository.softDeleteRentalPerson(id);

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: id,
    action: 'DELETE',
    description: `Rental person "${existing.name}" deleted.`,
    performedById: actorId,
  });
}
