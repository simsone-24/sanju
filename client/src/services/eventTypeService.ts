import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type {
  CreateEventTypeInput,
  EventTypeDetail,
  ListEventTypesParams,
  UpdateEventTypeInput,
} from '../types/eventType';
import type { EventTypeOption } from '../types/masters';

export async function listActive(): Promise<EventTypeOption[]> {
  const response = await apiClient.get<ApiSuccessResponse<EventTypeOption[]>>('/event-types', {
    params: { status: 'ACTIVE', limit: 100 },
  });
  return response.data.data;
}

export interface ListEventTypesResult {
  records: EventTypeDetail[];
  meta: PaginationMeta;
}

export async function list(params: ListEventTypesParams): Promise<ListEventTypesResult> {
  const response = await apiClient.get<ApiSuccessResponse<EventTypeDetail[]>>('/event-types', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

export async function create(input: CreateEventTypeInput): Promise<EventTypeDetail> {
  const response = await apiClient.post<ApiSuccessResponse<EventTypeDetail>>('/event-types', input);
  return response.data.data;
}

export async function update(id: number, input: UpdateEventTypeInput): Promise<EventTypeDetail> {
  const response = await apiClient.put<ApiSuccessResponse<EventTypeDetail>>(`/event-types/${id}`, input);
  return response.data.data;
}

export async function remove(id: number): Promise<void> {
  await apiClient.delete(`/event-types/${id}`);
}
