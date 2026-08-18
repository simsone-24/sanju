import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type { Invoice } from '../types/invoice';

export async function getForOrder(orderId: number): Promise<Invoice> {
  const response = await apiClient.get<ApiSuccessResponse<Invoice>>(`/invoices/order/${orderId}`);
  return response.data.data;
}

export async function downloadPdf(orderId: number, fileName: string): Promise<void> {
  const response = await apiClient.get<Blob>(`/invoices/order/${orderId}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
