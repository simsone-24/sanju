import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type {
  CreateEnquiryInput,
  EnquiryDetail,
  EnquiryFollowUp,
  EnquiryListItem,
  EnquiryStats,
  EnquiryStatus,
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

export async function getStats(): Promise<EnquiryStats> {
  const response = await apiClient.get<ApiSuccessResponse<EnquiryStats>>('/enquiries/stats');
  return response.data.data;
}

export async function getById(id: string): Promise<EnquiryDetail> {
  const response = await apiClient.get<ApiSuccessResponse<EnquiryDetail>>(`/enquiries/${id}`);
  return response.data.data;
}

export async function create(input: CreateEnquiryInput): Promise<EnquiryDetail> {
  const response = await apiClient.post<ApiSuccessResponse<EnquiryDetail>>('/enquiries', input);
  return response.data.data;
}

export async function update(id: string, input: UpdateEnquiryInput): Promise<EnquiryDetail> {
  const response = await apiClient.put<ApiSuccessResponse<EnquiryDetail>>(`/enquiries/${id}`, input);
  return response.data.data;
}

export async function changeStatus(id: string, status: EnquiryStatus, remarks?: string): Promise<EnquiryDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<EnquiryDetail>>(`/enquiries/${id}/status`, {
    status,
    remarks,
  });
  return response.data.data;
}

export async function addFollowUp(
  id: string,
  input: { followUpDate: string; notes?: string; outcome?: string },
): Promise<EnquiryFollowUp> {
  const response = await apiClient.post<ApiSuccessResponse<EnquiryFollowUp>>(`/enquiries/${id}/follow-ups`, input);
  return response.data.data;
}
