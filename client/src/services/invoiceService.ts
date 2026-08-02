import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type { Invoice } from '../types/invoice';

export async function getForOrder(orderId: string): Promise<Invoice> {
  const response = await apiClient.get<ApiSuccessResponse<Invoice>>(`/invoices/order/${orderId}`);
  return response.data.data;
}
