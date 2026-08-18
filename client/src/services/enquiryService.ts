import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type {
  CreateEnquiryInput,
  EnquiryDetail,
  EnquiryFollowUp,
  EnquiryListItem,
  EnquiryStats,
  EnquiryStatus,
  EnquiryTimelineEntry,
  ListEnquiriesParams,
  UpdateEnquiryInput,
} from '../types/enquiry';

export interface ListEnquiriesResult {
  records: EnquiryListItem[];
  meta: PaginationMeta;
}

export async function list(params: ListEnquiriesParams): Promise<ListEnquiriesResult> {
  const response = await apiClient.get<ApiSuccessResponse<EnquiryListItem[]>>('/enquiries', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

// Excludes page/limit/statusGroup — the cards' own counts narrow along with every other active
// filter, but each card defines its own status group rather than reading `view` from the URL.
export type EnquiryStatsParams = Omit<ListEnquiriesParams, 'page' | 'limit' | 'statusGroup'>;

export async function getStats(params: EnquiryStatsParams): Promise<EnquiryStats> {
  const response = await apiClient.get<ApiSuccessResponse<EnquiryStats>>('/enquiries/stats', { params });
  return response.data.data;
}

export async function getById(id: number): Promise<EnquiryDetail> {
  const response = await apiClient.get<ApiSuccessResponse<EnquiryDetail>>(`/enquiries/${id}`);
  return response.data.data;
}

// The enquiry's complete history, including the activity of its quotations and resulting order.
export async function getTimeline(id: number): Promise<EnquiryTimelineEntry[]> {
  const response = await apiClient.get<ApiSuccessResponse<EnquiryTimelineEntry[]>>(`/enquiries/${id}/timeline`);
  return response.data.data;
}

export async function create(input: CreateEnquiryInput): Promise<EnquiryDetail> {
  const response = await apiClient.post<ApiSuccessResponse<EnquiryDetail>>('/enquiries', input);
  return response.data.data;
}

export async function update(id: number, input: UpdateEnquiryInput): Promise<EnquiryDetail> {
  const response = await apiClient.put<ApiSuccessResponse<EnquiryDetail>>(`/enquiries/${id}`, input);
  return response.data.data;
}

export async function changeStatus(id: number, status: EnquiryStatus, remarks?: string): Promise<EnquiryDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<EnquiryDetail>>(`/enquiries/${id}/status`, {
    status,
    remarks,
  });
  return response.data.data;
}

// Cascades on the server: the enquiry's quotations, its order, and that order's payments, invoice,
// payment tracker, task plan and documents are soft-deleted along with it.
export async function remove(id: number): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<null>>(`/enquiries/${id}`);
}

export async function addFollowUp(
  id: number,
  input: { followUpDate: string; notes?: string; outcome?: string },
): Promise<EnquiryFollowUp> {
  const response = await apiClient.post<ApiSuccessResponse<EnquiryFollowUp>>(`/enquiries/${id}/follow-ups`, input);
  return response.data.data;
}
