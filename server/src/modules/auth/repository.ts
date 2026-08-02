import { prisma } from '../../config/prisma';

// The whole access picture in one read: the group the user belongs to, that group's permissions,
// and the user's own overrides — everything resolveEffectivePermissions() needs.
const userWithAccessInclude = {
  userGroup: {
    include: { permissions: { select: { module: true, action: true } } },
  },
  permissionOverrides: { select: { module: true, action: true } },
  company: true,
} as const;

export function findUserByUsername(username: string) {
  return prisma.user.findFirst({
    where: { username, deletedAt: null },
    include: userWithAccessInclude,
  });
}

export function findUserById(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: userWithAccessInclude,
  });
}

export function getUserWithPermissions(id: string) {
  return findUserById(id);
}
