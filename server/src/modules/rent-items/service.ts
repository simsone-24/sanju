import { RentalItemStatus } from '@prisma/client';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { buildPaginationMeta } from '../../utils/pagination';
import * as rentItemsRepository from './repository';
import { CreateRentalItemInput, ListRentalItemsParams, UpdateRentalItemInput } from './types';

const MODULE = 'RENT';

export async function list(params: ListRentalItemsParams) {
  const { records, totalRecords } = await rentItemsRepository.listRentalItems(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export function listCategories(companyId: number) {
  return rentItemsRepository.listRentalItemCategories(companyId);
}

export async function getById(companyId: number, id: number) {
  const item = await rentItemsRepository.findRentalItemById(companyId, id);
  if (!item) throw new AppError(404, 'Rental item not found.');
  return item;
}

export async function create(companyId: number, actorId: number, input: CreateRentalItemInput) {
  const duplicate = await rentItemsRepository.findRentalItemByName(companyId, input.itemName);
  if (duplicate) {
    throw new AppError(409, 'A rental item with this name already exists.', [
      { field: 'itemName', message: 'Item name is already in use.' },
    ]);
  }

  const item = await rentItemsRepository.createRentalItem({
    companyId,
    itemName: input.itemName,
    category: input.category,
    defaultRentRate: input.defaultRentRate,
    description: input.description,
    status: RentalItemStatus.ACTIVE,
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: item.id,
    action: 'CREATE',
    description: `Rental item "${item.itemName}" created.`,
    performedById: actorId,
  });

  return item;
}

export async function update(companyId: number, actorId: number, id: number, input: UpdateRentalItemInput) {
  const existing = await rentItemsRepository.findRentalItemById(companyId, id);
  if (!existing) throw new AppError(404, 'Rental item not found.');

  if (input.itemName && input.itemName !== existing.itemName) {
    const duplicate = await rentItemsRepository.findRentalItemByName(companyId, input.itemName);
    if (duplicate && duplicate.id !== id) {
      throw new AppError(409, 'A rental item with this name already exists.', [
        { field: 'itemName', message: 'Item name is already in use.' },
      ]);
    }
  }

  // Renaming is always allowed: every stock out line carries its own item_name_snapshot, so past
  // rental documents keep the name they were issued under (stock.md §28, §36 Rule 13).
  const item = await rentItemsRepository.updateRentalItem(id, {
    itemName: input.itemName,
    category: input.category,
    defaultRentRate: input.defaultRentRate,
    description: input.description,
    status: input.status,
  });

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: item.id,
    action: 'UPDATE',
    description: `Rental item "${item.itemName}" updated.`,
    performedById: actorId,
  });

  return item;
}

export async function remove(companyId: number, actorId: number, id: number): Promise<void> {
  const existing = await rentItemsRepository.findRentalItemById(companyId, id);
  if (!existing) throw new AppError(404, 'Rental item not found.');

  const usageCount = await rentItemsRepository.countStockOutLinesForItem(id);
  if (usageCount > 0) {
    throw new AppError(
      409,
      `Cannot delete "${existing.itemName}" — it appears on ${usageCount} stock out line(s). Mark it inactive instead.`,
    );
  }

  await rentItemsRepository.softDeleteRentalItem(id);

  await logActivity({
    companyId,
    module: MODULE,
    referenceId: id,
    action: 'DELETE',
    description: `Rental item "${existing.itemName}" deleted.`,
    performedById: actorId,
  });
}
