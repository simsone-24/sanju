import type { PermissionGrant } from './permission';
import type { UserGroupStatus } from './userGroup';

export interface UserListItem {
  id: string;
  employeeCode: string | null;
  fullName: string;
  username: string;
  email: string | null;
  mobile: string;
  city: string | null;
  profilePhoto: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userGroup: { id: string; groupName: string; status: UserGroupStatus };
}

export interface UserDetail extends UserListItem {
  /** user.md §User Permission Override — permissions granted to this user on top of their group. */
  permissionOverrides: PermissionGrant[];
}

export interface CreateUserInput {
  employeeCode?: string;
  fullName: string;
  username: string;
  password: string;
  confirmPassword: string;
  mobile: string;
  email?: string;
  city?: string;
  userGroupId: string;
  isActive: boolean;
  permissionOverrides: PermissionGrant[];
}

export interface UpdateUserInput {
  employeeCode?: string;
  fullName?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  mobile?: string;
  email?: string;
  city?: string;
  userGroupId?: string;
  isActive?: boolean;
  permissionOverrides?: PermissionGrant[];
}

export interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  userGroupId?: string;
  isActive?: boolean;
}
