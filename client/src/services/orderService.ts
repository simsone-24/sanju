import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type {
  ChangeOrderStatusInput,
  ListOrdersParams,
  OrderDetail,
  OrderListItem,
  OrderStats,
  OrderTimelineEntry,
  UpdateOrderInput,
} from '../types/order';

export interface ListOrdersResult {
  records: OrderListItem[];
  meta: PaginationMeta;
}

export async function list(params: ListOrdersParams): Promise<ListOrdersResult> {
  const response = await apiClient.get<ApiSuccessResponse<OrderListItem[]>>('/orders', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

// Excludes page/limit/status — the cards' own counts narrow along with every other active
// filter, but each card defines its own status rather than reading it back off the list.
export type OrderStatsParams = Omit<ListOrdersParams, 'page' | 'limit' | 'status'>;

export async function getStats(params: OrderStatsParams): Promise<OrderStats> {
  const response = await apiClient.get<ApiSuccessResponse<OrderStats>>('/orders/stats', { params });
  return response.data.data;
}

export async function getById(id: string): Promise<OrderDetail> {
  const response = await apiClient.get<ApiSuccessResponse<OrderDetail>>(`/orders/${id}`);
  return response.data.data;
}

export async function getTimeline(id: string): Promise<OrderTimelineEntry[]> {
  const response = await apiClient.get<ApiSuccessResponse<OrderTimelineEntry[]>>(`/orders/${id}/timeline`);
  return response.data.data;
}

export async function update(id: string, input: UpdateOrderInput): Promise<OrderDetail> {
  const response = await apiClient.put<ApiSuccessResponse<OrderDetail>>(`/orders/${id}`, input);
  return response.data.data;
}

export async function changeStatus(id: string, input: ChangeOrderStatusInput): Promise<OrderDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<OrderDetail>>(`/orders/${id}/status`, input);
  return response.data.data;
}
