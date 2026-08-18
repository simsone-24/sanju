import type { PermissionGrant } from './permission';
import type { UserGroupStatus } from './userGroup';

export interface UserListItem {
  id: number;
  fullName: string;
  username: string;
  email: string | null;
  mobile: string;
  city: string | null;
  profilePhoto: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userGroup: { id: number; groupName: string; status: UserGroupStatus };
}

export interface UserDetail extends UserListItem {
  /** user.md §User Permission Override — permissions granted to this user on top of their group. */
  permissionOverrides: PermissionGrant[];
}

export interface CreateUserInput {
  fullName: string;
  username: string;
  password: string;
  confirmPassword: string;
  mobile: string;
  email?: string;
  city?: string;
  userGroupId: number;
  isActive: boolean;
  permissionOverrides: PermissionGrant[];
}

export interface UpdateUserInput {
  fullName?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  mobile?: string;
  email?: string;
  city?: string;
  userGroupId?: number;
  isActive?: boolean;
  permissionOverrides?: PermissionGrant[];
}

export interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  userGroupId?: number;
  isActive?: boolean;
}
