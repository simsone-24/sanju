import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { PermissionGrant } from '../permissions/types';
import { ListUserGroupsParams } from './types';

const userGroupListSelect = {
  id: true,
  groupName: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { users: true } },
} satisfies Prisma.UserGroupSelect;

const userGroupDetailInclude = {
  permissions: { select: { module: true, action: true }, orderBy: [{ module: 'asc' }, { action: 'asc' }] },
  _count: { select: { users: true } },
} satisfies Prisma.UserGroupInclude;

export async function listUserGroups(params: ListUserGroupsParams) {
  const where: Prisma.UserGroupWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.status ? { status: params.status } : {}),
    ...(params.search ? { groupName: { contains: params.search } } : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.userGroup.findMany({
      where,
      select: userGroupListSelect,
      orderBy: { groupName: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.userGroup.count({ where }),
  ]);

  return { records, totalRecords };
}

/** Active groups only — user.md: "Inactive User Groups cannot be assigned to new users." */
export function listActiveUserGroups(companyId: number) {
  return prisma.userGroup.findMany({
    where: { companyId, deletedAt: null, status: 'ACTIVE' },
    select: { id: true, groupName: true },
    orderBy: { groupName: 'asc' },
  });
}

export function findUserGroupById(companyId: number, id: number) {
  return prisma.userGroup.findFirst({
    where: { id, companyId, deletedAt: null },
    include: userGroupDetailInclude,
  });
}

export function findUserGroupByName(companyId: number, groupName: string) {
  return prisma.userGroup.findFirst({ where: { companyId, groupName, deletedAt: null } });
}

export function countUsersInGroup(userGroupId: number) {
  return prisma.user.count({ where: { userGroupId, deletedAt: null } });
}

// The group and its permissions are written by a single nested create, so a group never exists
// without the permissions it was created with.
export function createUserGroup(companyId: number, data: Prisma.UserGroupCreateWithoutCompanyInput) {
  return prisma.userGroup.create({
    data: { ...data, company: { connect: { id: companyId } } },
    include: userGroupDetailInclude,
  });
}

export function updateUserGroup(id: number, data: Prisma.UserGroupUpdateInput) {
  return prisma.userGroup.update({ where: { id }, data, include: userGroupDetailInclude });
}

/**
 * Swaps the group's whole permission set in one transaction. Replacing rather than diffing keeps
 * the stored set exactly what the editor submitted — a permission cleared in the UI cannot survive
 * as a leftover row.
 */
export async function replacePermissions(userGroupId: number, permissions: PermissionGrant[]): Promise<void> {
  await prisma.$transaction([
    prisma.userGroupPermission.deleteMany({ where: { userGroupId } }),
    ...(permissions.length > 0
      ? [
          prisma.userGroupPermission.createMany({
            data: permissions.map((permission) => ({
              userGroupId,
              module: permission.module,
              action: permission.action,
            })),
          }),
        ]
      : []),
  ]);
}

export function softDeleteUserGroup(id: number) {
  return prisma.userGroup.update({ where: { id }, data: { deletedAt: new Date() } });
}
