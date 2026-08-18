import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type { UserOption } from '../types/masters';
import type { CreateUserInput, ListUsersParams, UpdateUserInput, UserDetail, UserListItem } from '../types/user';

/** Active users for assignment pickers — available to any signed-in user, unlike the list below. */
export async function listActive(): Promise<UserOption[]> {
  const response = await apiClient.get<ApiSuccessResponse<UserOption[]>>('/users/options');
  return response.data.data;
}

export interface ListUsersResult {
  records: UserListItem[];
  meta: PaginationMeta;
}

export async function list(params: ListUsersParams): Promise<ListUsersResult> {
  const response = await apiClient.get<ApiSuccessResponse<UserListItem[]>>('/users', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

export async function getById(id: number): Promise<UserDetail> {
  const response = await apiClient.get<ApiSuccessResponse<UserDetail>>(`/users/${id}`);
  return response.data.data;
}

export async function create(input: CreateUserInput): Promise<UserDetail> {
  const response = await apiClient.post<ApiSuccessResponse<UserDetail>>('/users', input);
  return response.data.data;
}

export async function update(id: number, input: UpdateUserInput): Promise<UserDetail> {
  const response = await apiClient.put<ApiSuccessResponse<UserDetail>>(`/users/${id}`, input);
  return response.data.data;
}

export async function uploadProfilePhoto(id: number, file: File): Promise<UserDetail> {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await apiClient.post<ApiSuccessResponse<UserDetail>>(`/users/${id}/photo`, formData);
  return response.data.data;
}

// The photo route is authenticated (staff photos are not public files), so it can't be used as a
// plain <img src>. Same blob + object URL approach as task completion photos; the caller revokes
// the URL when the preview goes away.
export async function getProfilePhotoObjectUrl(id: number): Promise<string> {
  const response = await apiClient.get(`/users/${id}/photo`, { responseType: 'blob' });
  return URL.createObjectURL(response.data as Blob);
}

export async function remove(id: number): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
