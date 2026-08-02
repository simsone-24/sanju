import { Prisma } from '@prisma/client';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { buildPaginationMeta } from '../../utils/pagination';
import { dedupeGrants } from '../permissions/service';
import * as userGroupsRepository from './repository';
import { CreateUserGroupInput, ListUserGroupsParams, UpdateUserGroupInput } from './types';

const ACTIVITY_MODULE = 'USER_GROUPS';

async function assertGroupNameIsFree(companyId: string, groupName: string, exceptId?: string): Promise<void> {
  const owner = await userGroupsRepository.findUserGroupByName(companyId, groupName);
  if (owner && owner.id !== exceptId) {
    throw new AppError(409, 'A user group with this name already exists.', [
      { field: 'groupName', message: 'Group name is already in use.' },
    ]);
  }
}

export async function list(params: ListUserGroupsParams) {
  const { records, totalRecords } = await userGroupsRepository.listUserGroups(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export function listOptions(companyId: string) {
  return userGroupsRepository.listActiveUserGroups(companyId);
}

export async function getById(companyId: string, id: string) {
  const userGroup = await userGroupsRepository.findUserGroupById(companyId, id);
  if (!userGroup) throw new AppError(404, 'User group not found.');
  return userGroup;
}

export async function create(companyId: string, actorId: string, input: CreateUserGroupInput) {
  await assertGroupNameIsFree(companyId, input.groupName);

  const permissions = dedupeGrants(input.permissions ?? []);

  const userGroup = await userGroupsRepository.createUserGroup(companyId, {
    groupName: input.groupName,
    description: input.description || null,
    status: input.status ?? 'ACTIVE',
    permissions: {
      create: permissions.map((permission) => ({ module: permission.module, action: permission.action })),
    },
  });

  await logActivity({
    companyId,
    module: ACTIVITY_MODULE,
    referenceId: userGroup.id,
    action: 'CREATE',
    description: `User group "${userGroup.groupName}" created with ${permissions.length} permission(s).`,
    performedById: actorId,
  });

  return userGroup;
}

export async function update(companyId: string, actorId: string, id: string, input: UpdateUserGroupInput) {
  const existing = await userGroupsRepository.findUserGroupById(companyId, id);
  if (!existing) throw new AppError(404, 'User group not found.');

  if (input.groupName && input.groupName !== existing.groupName) {
    await assertGroupNameIsFree(companyId, input.groupName, id);
  }

  // Permissions are only touched when the caller sends them, so an update of the basic details
  // alone leaves the group's access exactly as it was.
  if (input.permissions) {
    const permissions = dedupeGrants(input.permissions);
    await userGroupsRepository.replacePermissions(id, permissions);

    await logActivity({
      companyId,
      module: ACTIVITY_MODULE,
      referenceId: id,
      action: 'UPDATE_PERMISSIONS',
      description: `Permissions updated for user group "${input.groupName ?? existing.groupName}".`,
      performedById: actorId,
      metadata: permissions as unknown as Prisma.InputJsonValue,
    });
  }

  const userGroup = await userGroupsRepository.updateUserGroup(id, {
    groupName: input.groupName,
    ...(input.description === undefined ? {} : { description: input.description || null }),
    status: input.status,
  });

  await logActivity({
    companyId,
    module: ACTIVITY_MODULE,
    referenceId: userGroup.id,
    action: 'UPDATE',
    description: `User group "${userGroup.groupName}" updated.`,
    performedById: actorId,
  });

  return userGroup;
}

export async function remove(companyId: string, actorId: string, id: string): Promise<void> {
  const existing = await userGroupsRepository.findUserGroupById(companyId, id);
  if (!existing) throw new AppError(404, 'User group not found.');

  // user.md §User Group Rules — "A User Group cannot be deleted if users are assigned."
  const assignedUsers = await userGroupsRepository.countUsersInGroup(id);
  if (assignedUsers > 0) {
    throw new AppError(
      409,
      `Cannot delete "${existing.groupName}" while ${assignedUsers} user(s) are assigned to it.`,
    );
  }

  await userGroupsRepository.softDeleteUserGroup(id);

  await logActivity({
    companyId,
    module: ACTIVITY_MODULE,
    referenceId: id,
    action: 'DELETE',
    description: `User group "${existing.groupName}" deleted.`,
    performedById: actorId,
  });
}
