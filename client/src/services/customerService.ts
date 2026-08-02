import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type { CustomerDetail, CustomerHistory, CustomerListItem, ListCustomersParams } from '../types/customer';
import type { CustomerOption } from '../types/masters';

// A blank query intentionally omits the `search` param instead of sending an empty string (the API
// rejects that) so callers can show a default list of customers before anything is typed.
export async function search(query: string): Promise<CustomerOption[]> {
  const trimmed = query.trim();
  const response = await apiClient.get<ApiSuccessResponse<CustomerOption[]>>('/customers', {
    params: { limit: 20, ...(trimmed ? { search: trimmed } : {}) },
  });
  return response.data.data;
}

// Customer master for filter dropdowns. Capped at the API's largest allowed page size — beyond
// that the free-text search box is the way to reach a customer, not a longer <select>.
export async function listOptions(): Promise<CustomerOption[]> {
  const response = await apiClient.get<ApiSuccessResponse<CustomerOption[]>>('/customers', {
    params: { limit: 100 },
  });
  return response.data.data;
}

export interface ListCustomersResult {
  records: CustomerListItem[];
  meta: PaginationMeta;
}

export async function list(params: ListCustomersParams): Promise<ListCustomersResult> {
  const response = await apiClient.get<ApiSuccessResponse<CustomerListItem[]>>('/customers', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

export async function getById(id: string): Promise<CustomerDetail> {
  const response = await apiClient.get<ApiSuccessResponse<CustomerDetail>>(`/customers/${id}`);
  return response.data.data;
}

export async function getHistory(id: string): Promise<CustomerHistory> {
  const response = await apiClient.get<ApiSuccessResponse<CustomerHistory>>(`/customers/${id}/orders`);
  return response.data.data;
}
