import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type { CompanyDetail } from '../types/company';
import type {
  CreateQuotationInput,
  ListQuotationsParams,
  QuotationDetail,
  QuotationGroupedRow,
  QuotationListItem,
  QuotationStats,
  QuotationTimelineEntry,
  UpdateQuotationInput,
} from '../types/quotation';

export interface ListQuotationsResult {
  records: QuotationListItem[];
  meta: PaginationMeta;
}

export interface ListGroupedQuotationsResult {
  records: QuotationGroupedRow[];
  meta: PaginationMeta;
}

export async function list(params: ListQuotationsParams): Promise<ListQuotationsResult> {
  const response = await apiClient.get<ApiSuccessResponse<QuotationListItem[]>>('/quotations', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

// The Quotations module's default list: one row per enquiry (latest revision) plus individual
// rows for Customer/Order/Manual-sourced quotations. See server quotations/service.ts listGrouped.
export async function listGrouped(
  params: Omit<ListQuotationsParams, 'enquiryId' | 'orderId'>,
): Promise<ListGroupedQuotationsResult> {
  const response = await apiClient.get<ApiSuccessResponse<QuotationGroupedRow[]>>('/quotations/grouped', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

export async function getStats(): Promise<QuotationStats> {
  const response = await apiClient.get<ApiSuccessResponse<QuotationStats>>('/quotations/stats');
  return response.data.data;
}

export async function getById(id: number): Promise<QuotationDetail> {
  const response = await apiClient.get<ApiSuccessResponse<QuotationDetail>>(`/quotations/${id}`);
  return response.data.data;
}

// Audit trail rendered on the quotation view page — created, edited, sent, approved, downloaded.
export async function getTimeline(id: number): Promise<QuotationTimelineEntry[]> {
  const response = await apiClient.get<ApiSuccessResponse<QuotationTimelineEntry[]>>(`/quotations/${id}/timeline`);
  return response.data.data;
}

// Company letterhead + bank details for the quotation preview/PDF header. Accessible to any user
// who can view quotations (not gated behind Settings permissions).
export async function getBranding(): Promise<CompanyDetail> {
  const response = await apiClient.get<ApiSuccessResponse<CompanyDetail>>('/quotations/branding');
  return response.data.data;
}

export async function create(input: CreateQuotationInput): Promise<QuotationDetail> {
  const response = await apiClient.post<ApiSuccessResponse<QuotationDetail>>('/quotations', input);
  return response.data.data;
}

export async function update(id: number, input: UpdateQuotationInput): Promise<QuotationDetail> {
  const response = await apiClient.put<ApiSuccessResponse<QuotationDetail>>(`/quotations/${id}`, input);
  return response.data.data;
}

export async function changeStatus(
  id: number,
  status: 'SENT' | 'REJECTED',
  remarks?: string,
): Promise<QuotationDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<QuotationDetail>>(`/quotations/${id}/status`, {
    status,
    remarks,
  });
  return response.data.data;
}

export async function approve(id: number): Promise<QuotationDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<QuotationDetail>>(`/quotations/${id}/approve`);
  return response.data.data;
}

// Uploads one or more sample decor images (JPEG/PNG) to a saved quotation.
export async function uploadImages(id: number, files: File[]): Promise<QuotationDetail> {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const response = await apiClient.post<ApiSuccessResponse<QuotationDetail>>(`/quotations/${id}/images`, formData);
  return response.data.data;
}

export async function deleteImage(id: number, imageId: number): Promise<QuotationDetail> {
  const response = await apiClient.delete<ApiSuccessResponse<QuotationDetail>>(`/quotations/${id}/images/${imageId}`);
  return response.data.data;
}

// Streams the authenticated PDF blob and triggers a browser download. The endpoint regenerates the
// PDF on demand, so this works even for a quotation whose file was never persisted.
export async function downloadPdf(id: number, fileName: string): Promise<void> {
  const response = await apiClient.get<Blob>(`/quotations/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

// Opens the PDF in a new browser tab (for Print — the viewer's print dialog takes over from there).
export async function openPdf(id: number): Promise<void> {
  const response = await apiClient.get<Blob>(`/quotations/${id}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(response.data);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}
