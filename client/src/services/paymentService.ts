import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type { OrderPaymentSummary } from '../types/order';
import type { CreatePaymentInput } from '../types/payment';

export async function create(orderId: number, input: CreatePaymentInput): Promise<OrderPaymentSummary> {
  const response = await apiClient.post<ApiSuccessResponse<OrderPaymentSummary>>(`/orders/${orderId}/payments`, input);
  return response.data.data;
}
