import { UserGroupStatus } from '@prisma/client';
import { PermissionGrant } from '../permissions/types';

export interface CreateUserGroupInput {
  groupName: string;
  description?: string;
  status?: UserGroupStatus;
  permissions?: PermissionGrant[];
}

export interface UpdateUserGroupInput {
  groupName?: string;
  description?: string;
  status?: UserGroupStatus;
  permissions?: PermissionGrant[];
}

export interface ListUserGroupsParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  status?: UserGroupStatus;
}
