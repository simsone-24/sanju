import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { PermissionGrant } from '../permissions/types';
import { ListUsersParams } from './types';

// passwordHash is never part of a select here — it is read only by the auth module's own queries.
const userSelect = {
  id: true,
  companyId: true,
  fullName: true,
  username: true,
  email: true,
  mobile: true,
  city: true,
  profilePhoto: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  userGroup: { select: { id: true, groupName: true, status: true } },
} satisfies Prisma.UserSelect;

const userDetailSelect = {
  ...userSelect,
  permissionOverrides: { select: { module: true, action: true }, orderBy: [{ module: 'asc' }, { action: 'asc' }] },
} satisfies Prisma.UserSelect;

export async function listUsers(params: ListUsersParams) {
  const where: Prisma.UserWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.isActive === undefined ? {} : { isActive: params.isActive }),
    ...(params.userGroupId ? { userGroupId: params.userGroupId } : {}),
    ...(params.search
      ? {
          OR: [
            { fullName: { contains: params.search } },
            { username: { contains: params.search } },
            { email: { contains: params.search } },
            { mobile: { contains: params.search } },
            { city: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { fullName: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { records, totalRecords };
}

/**
 * The minimum needed to populate an "Assigned To"/"Coordinator" picker. Deliberately narrow: this
 * is the one user query reachable without Masters access, so it exposes no contact details.
 */
export function listUserOptions(companyId: number) {
  return prisma.user.findMany({
    where: { companyId, deletedAt: null, isActive: true },
    select: { id: true, fullName: true, username: true },
    orderBy: { fullName: 'asc' },
  });
}

export function findUserById(companyId: number, id: number) {
  return prisma.user.findFirst({ where: { id, companyId, deletedAt: null }, select: userDetailSelect });
}

export function findUserByUsername(username: string) {
  return prisma.user.findFirst({ where: { username, deletedAt: null }, select: { id: true } });
}

export function findUserByEmail(email: string) {
  return prisma.user.findFirst({ where: { email, deletedAt: null }, select: { id: true } });
}

export function findUserGroupForCompany(companyId: number, userGroupId: number) {
  return prisma.userGroup.findFirst({ where: { id: userGroupId, companyId, deletedAt: null } });
}

export function createUser(data: Prisma.UserUncheckedCreateInput) {
  return prisma.user.create({ data, select: userDetailSelect });
}

export function updateUser(id: number, data: Prisma.UserUncheckedUpdateInput) {
  return prisma.user.update({ where: { id }, data, select: userDetailSelect });
}

/** Same replace-in-one-transaction model as user group permissions — see user-groups/repository.ts. */
export async function replacePermissionOverrides(userId: number, overrides: PermissionGrant[]): Promise<void> {
  await prisma.$transaction([
    prisma.userPermissionOverride.deleteMany({ where: { userId } }),
    ...(overrides.length > 0
      ? [
          prisma.userPermissionOverride.createMany({
            data: overrides.map((override) => ({
              userId,
              module: override.module,
              action: override.action,
            })),
          }),
        ]
      : []),
  ]);
}

export function softDeleteUser(id: number) {
  return prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
}
