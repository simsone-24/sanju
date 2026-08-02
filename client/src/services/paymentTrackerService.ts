import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type {
  ListPaymentTrackerParams,
  PaymentTrackerDetail,
  PaymentTrackerPayment,
  PaymentTrackerRecord,
  PaymentTrackerStats,
  UpdatePaymentTrackerInput,
} from '../types/paymentTracker';

export interface ListPaymentTrackerResult {
  records: PaymentTrackerRecord[];
  meta: PaginationMeta;
}

export async function list(params: ListPaymentTrackerParams): Promise<ListPaymentTrackerResult> {
  const response = await apiClient.get<ApiSuccessResponse<PaymentTrackerRecord[]>>('/payment-tracker', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

export async function getStats(): Promise<PaymentTrackerStats> {
  const response = await apiClient.get<ApiSuccessResponse<PaymentTrackerStats>>('/payment-tracker/stats');
  return response.data.data;
}

export async function getByOrderId(orderId: string): Promise<PaymentTrackerDetail> {
  const response = await apiClient.get<ApiSuccessResponse<PaymentTrackerDetail>>(`/payment-tracker/${orderId}`);
  return response.data.data;
}

export async function getHistory(orderId: string): Promise<PaymentTrackerPayment[]> {
  const response = await apiClient.get<ApiSuccessResponse<PaymentTrackerPayment[]>>(
    `/payment-tracker/${orderId}/history`,
  );
  return response.data.data;
}

export async function update(orderId: string, input: UpdatePaymentTrackerInput): Promise<PaymentTrackerDetail> {
  const response = await apiClient.put<ApiSuccessResponse<PaymentTrackerDetail>>(
    `/payment-tracker/${orderId}`,
    input,
  );
  return response.data.data;
}
