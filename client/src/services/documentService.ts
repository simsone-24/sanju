import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type { OrderDocumentDetail, UploadDocumentInput } from '../types/document';

export async function listForOrder(orderId: number): Promise<OrderDocumentDetail[]> {
  const response = await apiClient.get<ApiSuccessResponse<OrderDocumentDetail[]>>(`/orders/${orderId}/documents`);
  return response.data.data;
}

export async function upload(orderId: number, input: UploadDocumentInput): Promise<OrderDocumentDetail> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('documentType', input.documentType);
  const response = await apiClient.post<ApiSuccessResponse<OrderDocumentDetail>>(
    `/orders/${orderId}/documents`,
    formData,
  );
  return response.data.data;
}

export async function downloadFile(id: number, fileName: string): Promise<void> {
  const response = await apiClient.get(`/documents/${id}/file`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function remove(id: number): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}
