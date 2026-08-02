import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type { CreateTaskInput, OrderTaskDetail, TaskCategory, UpdateTaskInput } from '../types/task';

export async function listForOrder(orderId: string, taskCategory: TaskCategory): Promise<OrderTaskDetail[]> {
  const response = await apiClient.get<ApiSuccessResponse<OrderTaskDetail[]>>(`/orders/${orderId}/tasks`, {
    params: { taskCategory },
  });
  return response.data.data;
}

export async function create(orderId: string, input: CreateTaskInput): Promise<OrderTaskDetail> {
  const response = await apiClient.post<ApiSuccessResponse<OrderTaskDetail>>(`/orders/${orderId}/tasks`, input);
  return response.data.data;
}

export async function update(taskId: string, input: UpdateTaskInput): Promise<OrderTaskDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<OrderTaskDetail>>(`/tasks/${taskId}`, input);
  return response.data.data;
}
