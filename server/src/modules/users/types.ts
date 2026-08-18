import { PermissionGrant } from '../permissions/types';

export interface CreateUserInput {
  fullName: string;
  username: string;
  password: string;
  mobile: string;
  email?: string;
  city?: string;
  userGroupId: number;
  isActive?: boolean;
  /** user.md §User Permission Override — extra permissions granted to this user alone. */
  permissionOverrides?: PermissionGrant[];
}

export interface UpdateUserInput {
  fullName?: string;
  username?: string;
  password?: string;
  mobile?: string;
  email?: string;
  city?: string;
  userGroupId?: number;
  isActive?: boolean;
  permissionOverrides?: PermissionGrant[];
}

export interface ListUsersParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  userGroupId?: number;
  isActive?: boolean;
}
