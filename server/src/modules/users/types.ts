import { PermissionGrant } from '../permissions/types';

export interface CreateUserInput {
  employeeCode?: string;
  fullName: string;
  username: string;
  password: string;
  mobile: string;
  email?: string;
  city?: string;
  userGroupId: string;
  isActive?: boolean;
  /** user.md §User Permission Override — extra permissions granted to this user alone. */
  permissionOverrides?: PermissionGrant[];
}

export interface UpdateUserInput {
  employeeCode?: string;
  fullName?: string;
  username?: string;
  password?: string;
  mobile?: string;
  email?: string;
  city?: string;
  userGroupId?: string;
  isActive?: boolean;
  permissionOverrides?: PermissionGrant[];
}

export interface ListUsersParams {
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  userGroupId?: string;
  isActive?: boolean;
}
