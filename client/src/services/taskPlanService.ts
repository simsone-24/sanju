import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type {
  CreateTaskGroupInput,
  CreateTaskItemInput,
  TaskGroupDetail,
  TaskGroupStatus,
  TaskItemDetail,
  UpdateTaskGroupInput,
  UpdateTaskItemInput,
} from '../types/taskPlan';

export async function listForOrder(orderId: number): Promise<TaskGroupDetail[]> {
  const response = await apiClient.get<ApiSuccessResponse<TaskGroupDetail[]>>(`/orders/${orderId}/task-plan`);
  return response.data.data;
}

export async function createGroup(orderId: number, input: CreateTaskGroupInput): Promise<TaskGroupDetail> {
  const response = await apiClient.post<ApiSuccessResponse<TaskGroupDetail>>(
    `/orders/${orderId}/task-plan`,
    input,
  );
  return response.data.data;
}

export async function updateGroup(groupId: number, input: UpdateTaskGroupInput): Promise<TaskGroupDetail> {
  const response = await apiClient.put<ApiSuccessResponse<TaskGroupDetail>>(
    `/task-plan/groups/${groupId}`,
    input,
  );
  return response.data.data;
}

// Publishing a draft group, or pulling a published one back. The server enforces which moves are
// allowed (a group whose tasks are under way can no longer go back to draft).
export async function changeGroupStatus(groupId: number, status: TaskGroupStatus): Promise<TaskGroupDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<TaskGroupDetail>>(
    `/task-plan/groups/${groupId}/status`,
    { status },
  );
  return response.data.data;
}

export async function deleteGroup(groupId: number): Promise<void> {
  await apiClient.delete(`/task-plan/groups/${groupId}`);
}

export async function createItem(groupId: number, input: CreateTaskItemInput): Promise<TaskItemDetail> {
  const response = await apiClient.post<ApiSuccessResponse<TaskItemDetail>>(
    `/task-plan/groups/${groupId}/items`,
    input,
  );
  return response.data.data;
}

export async function updateItem(itemId: number, input: UpdateTaskItemInput): Promise<TaskItemDetail> {
  const response = await apiClient.put<ApiSuccessResponse<TaskItemDetail>>(`/task-plan/items/${itemId}`, input);
  return response.data.data;
}

export async function deleteItem(itemId: number): Promise<void> {
  await apiClient.delete(`/task-plan/items/${itemId}`);
}

export async function uploadPhoto(itemId: number, photo: File): Promise<TaskItemDetail> {
  const formData = new FormData();
  formData.append('photo', photo);
  const response = await apiClient.post<ApiSuccessResponse<TaskItemDetail>>(
    `/task-plan/items/${itemId}/photo`,
    formData,
  );
  return response.data.data;
}

export async function removePhoto(itemId: number): Promise<TaskItemDetail> {
  const response = await apiClient.delete<ApiSuccessResponse<TaskItemDetail>>(`/task-plan/items/${itemId}/photo`);
  return response.data.data;
}

// The photo route is authenticated, so it can't be used as a plain <img src>. Fetching it as a
// blob and wrapping it in an object URL keeps the Authorization header intact; callers are
// responsible for revoking the URL when the preview closes.
export async function getPhotoObjectUrl(itemId: number): Promise<string> {
  const response = await apiClient.get(`/task-plan/items/${itemId}/photo`, { responseType: 'blob' });
  return URL.createObjectURL(response.data as Blob);
}
