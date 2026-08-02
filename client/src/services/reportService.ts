import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type { CustomerListItem } from '../types/customer';
import type {
  CustomerReportFilters,
  EventReportFilters,
  EventReportResult,
  OutstandingReportFilters,
  OutstandingReportResult,
  RevenueReportFilters,
  RevenueReportResult,
} from '../types/report';

export async function getRevenue(filters: RevenueReportFilters): Promise<RevenueReportResult & { meta: PaginationMeta }> {
  const response = await apiClient.get<ApiSuccessResponse<RevenueReportResult>>('/reports/revenue', {
    params: filters,
  });
  return { ...response.data.data, meta: response.data.meta! };
}

export async function getOutstanding(
  filters: OutstandingReportFilters,
): Promise<OutstandingReportResult & { meta: PaginationMeta }> {
  const response = await apiClient.get<ApiSuccessResponse<OutstandingReportResult>>('/reports/outstanding', {
    params: filters,
  });
  return { ...response.data.data, meta: response.data.meta! };
}

export async function getCustomers(
  filters: CustomerReportFilters,
): Promise<{ customers: CustomerListItem[]; meta: PaginationMeta }> {
  const response = await apiClient.get<ApiSuccessResponse<{ customers: CustomerListItem[] }>>('/reports/customers', {
    params: filters,
  });
  return { ...response.data.data, meta: response.data.meta! };
}

export async function getEvents(filters: EventReportFilters): Promise<EventReportResult & { meta: PaginationMeta }> {
  const response = await apiClient.get<ApiSuccessResponse<EventReportResult>>('/reports/events', {
    params: filters,
  });
  return { ...response.data.data, meta: response.data.meta! };
}
