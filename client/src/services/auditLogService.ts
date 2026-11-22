import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type {
  AuditLogEntry,
  AuditLogFilterOptions,
  DeletedItemDetail,
  DeletedItemRow,
  DeletedItemType,
  DeletedItemTypeSummary,
  ListAuditLogsParams,
  ListDeletedItemsParams,
} from '../types/auditLog';

export interface ListAuditLogsResult {
  records: AuditLogEntry[];
  meta: PaginationMeta;
}

export async function list(params: ListAuditLogsParams): Promise<ListAuditLogsResult> {
  const response = await apiClient.get<ApiSuccessResponse<AuditLogEntry[]>>('/audit-logs', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

export async function getFilterOptions(): Promise<AuditLogFilterOptions> {
  const response = await apiClient.get<ApiSuccessResponse<AuditLogFilterOptions>>('/audit-logs/filters');
  return response.data.data;
}

export interface ListDeletedItemsResult {
  records: DeletedItemRow[];
  meta: PaginationMeta;
}

export async function listDeleted(params: ListDeletedItemsParams): Promise<ListDeletedItemsResult> {
  const response = await apiClient.get<ApiSuccessResponse<DeletedItemRow[]>>('/audit-logs/deleted', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

export async function getDeletedSummary(): Promise<DeletedItemTypeSummary[]> {
  const response = await apiClient.get<ApiSuccessResponse<DeletedItemTypeSummary[]>>('/audit-logs/deleted/summary');
  return response.data.data;
}

/** One deleted record in full — fields, what a restore would bring back with it, and its history. */
export async function getDeletedItem(type: DeletedItemType, id: number): Promise<DeletedItemDetail> {
  const response = await apiClient.get<ApiSuccessResponse<DeletedItemDetail>>(`/audit-logs/deleted/${type}/${id}`);
  return response.data.data;
}
