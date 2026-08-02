import type { PermissionGrant } from './permission';

export type UserGroupStatus = 'ACTIVE' | 'INACTIVE';

export interface UserGroupListItem {
  id: string;
  groupName: string;
  description: string | null;
  status: UserGroupStatus;
  createdAt: string;
  updatedAt: string;
  _count: { users: number };
}

export interface UserGroupDetail extends UserGroupListItem {
  permissions: PermissionGrant[];
}

export interface UserGroupOption {
  id: string;
  groupName: string;
}

export interface SaveUserGroupInput {
  groupName: string;
  description?: string;
  status: UserGroupStatus;
  permissions: PermissionGrant[];
}

export interface ListUserGroupsParams {
  page: number;
  limit: number;
  search?: string;
  status?: UserGroupStatus;
}
