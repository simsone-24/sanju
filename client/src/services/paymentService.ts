import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type { OrderPaymentSummary } from '../types/order';
import type { CreatePaymentInput } from '../types/payment';

export async function create(orderId: number, input: CreatePaymentInput): Promise<OrderPaymentSummary> {
  const response = await apiClient.post<ApiSuccessResponse<OrderPaymentSummary>>(`/orders/${orderId}/payments`, input);
  return response.data.data;
}

/** Soft-deletes one payment; the server recomputes the order's collected / pending amounts and status. */
export async function remove(id: number): Promise<void> {
  await apiClient.delete(`/payments/${id}`);
}


/** Brings a soft-deleted payment back and recalculates the order's money (see Audit Log → Deleted Items). */
export async function restore(id: number): Promise<void> {
  await apiClient.post(`/payments/${id}/restore`);
}
