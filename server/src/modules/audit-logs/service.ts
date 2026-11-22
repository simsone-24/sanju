import { buildPaginationMeta } from '../../utils/pagination';
import { AppError } from '../../utils/AppError';
import * as deletedItemDetailRepository from './deletedItemDetail.repository';
import * as deletedItemsRepository from './deletedItems.repository';
import * as auditLogsRepository from './repository';
import { DeletedItemType, ListAuditLogsParams, ListDeletedItemsParams } from './types';

export async function list(params: ListAuditLogsParams) {
  const { records, totalRecords } = await auditLogsRepository.listAuditLogs(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export function getFilterOptions(companyId: number) {
  return auditLogsRepository.listFilterOptions(companyId);
}

export async function listDeleted(params: ListDeletedItemsParams) {
  const { records, totalRecords } = await deletedItemsRepository.listDeletedItems(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

/** One deleted record in full — its fields, what a restore would bring back with it, and its history. */
export async function getDeletedItem(companyId: number, type: DeletedItemType, id: number) {
  const detail = await deletedItemDetailRepository.getDeletedItemDetail(companyId, type, id);
  if (!detail) throw new AppError(404, 'Deleted record not found.');
  return detail;
}

export function getDeletedSummary(companyId: number) {
  return deletedItemsRepository.countDeletedItems(companyId);
}
