import { apiClient } from '../api/client';
import type { ApiSuccessResponse, PaginationMeta } from '../types/api';
import type {
  ListUserGroupsParams,
  SaveUserGroupInput,
  UserGroupDetail,
  UserGroupListItem,
  UserGroupOption,
} from '../types/userGroup';

export interface ListUserGroupsResult {
  records: UserGroupListItem[];
  meta: PaginationMeta;
}

export async function list(params: ListUserGroupsParams): Promise<ListUserGroupsResult> {
  const response = await apiClient.get<ApiSuccessResponse<UserGroupListItem[]>>('/user-groups', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

/** Active groups only — the server excludes inactive ones, which cannot be assigned to new users. */
export async function listOptions(): Promise<UserGroupOption[]> {
  const response = await apiClient.get<ApiSuccessResponse<UserGroupOption[]>>('/user-groups/options');
  return response.data.data;
}

export async function getById(id: string): Promise<UserGroupDetail> {
  const response = await apiClient.get<ApiSuccessResponse<UserGroupDetail>>(`/user-groups/${id}`);
  return response.data.data;
}

export async function create(input: SaveUserGroupInput): Promise<UserGroupDetail> {
  const response = await apiClient.post<ApiSuccessResponse<UserGroupDetail>>('/user-groups', input);
  return response.data.data;
}

export async function update(id: string, input: SaveUserGroupInput): Promise<UserGroupDetail> {
  const response = await apiClient.put<ApiSuccessResponse<UserGroupDetail>>(`/user-groups/${id}`, input);
  return response.data.data;
}

export async function remove(id: string): Promise<void> {
  await apiClient.delete(`/user-groups/${id}`);
}
