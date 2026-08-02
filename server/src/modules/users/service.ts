import bcrypt from 'bcrypt';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { buildPaginationMeta } from '../../utils/pagination';
import { dedupeGrants } from '../permissions/service';
import * as usersRepository from './repository';
import { CreateUserInput, ListUsersParams, UpdateUserInput } from './types';

const SALT_ROUNDS = 10;
const ACTIVITY_MODULE = 'USERS';

async function assertUsernameIsFree(username: string, exceptId?: string): Promise<void> {
  const owner = await usersRepository.findUserByUsername(username);
  if (owner && owner.id !== exceptId) {
    throw new AppError(409, 'A user with this username already exists.', [
      { field: 'username', message: 'Username is already in use.' },
    ]);
  }
}

async function assertEmailIsFree(email: string, exceptId?: string): Promise<void> {
  const owner = await usersRepository.findUserByEmail(email);
  if (owner && owner.id !== exceptId) {
    throw new AppError(409, 'A user with this email already exists.', [
      { field: 'email', message: 'Email is already in use.' },
    ]);
  }
}

/**
 * user.md §User Group Rules — "Inactive User Groups cannot be assigned to new users." The check runs
 * whenever a user is being moved into a group, not just on create: moving someone into an inactive
 * group is the same act. A user already sitting in a group that was later deactivated keeps it
 * until an administrator moves them.
 */
async function resolveUserGroup(companyId: string, userGroupId: string) {
  const userGroup = await usersRepository.findUserGroupForCompany(companyId, userGroupId);
  if (!userGroup) {
    throw new AppError(400, 'Selected user group does not exist.', [
      { field: 'userGroupId', message: 'Selected user group does not exist.' },
    ]);
  }
  if (userGroup.status === 'INACTIVE') {
    throw new AppError(400, 'An inactive user group cannot be assigned.', [
      { field: 'userGroupId', message: 'This user group is inactive.' },
    ]);
  }
  return userGroup;
}

export async function list(params: ListUsersParams) {
  const { records, totalRecords } = await usersRepository.listUsers(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export function listOptions(companyId: string) {
  return usersRepository.listUserOptions(companyId);
}

export async function getById(companyId: string, id: string) {
  const user = await usersRepository.findUserById(companyId, id);
  if (!user) throw new AppError(404, 'User not found.');
  return user;
}

export async function create(companyId: string, actorId: string, input: CreateUserInput) {
  await assertUsernameIsFree(input.username);
  if (input.email) await assertEmailIsFree(input.email);
  const userGroup = await resolveUserGroup(companyId, input.userGroupId);

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const overrides = dedupeGrants(input.permissionOverrides ?? []);

  // The user and any personal overrides are written by one nested create, so an account never
  // exists with only part of the access it was set up with.
  const user = await usersRepository.createUser({
    companyId,
    userGroupId: userGroup.id,
    employeeCode: input.employeeCode || null,
    fullName: input.fullName,
    username: input.username,
    email: input.email || null,
    mobile: input.mobile,
    city: input.city || null,
    passwordHash,
    isActive: input.isActive ?? true,
    permissionOverrides: {
      create: overrides.map((override) => ({ module: override.module, action: override.action })),
    },
  });

  await logActivity({
    companyId,
    module: ACTIVITY_MODULE,
    referenceId: user.id,
    action: 'CREATE',
    description: `User "${user.fullName}" (${user.username}) created in group "${userGroup.groupName}".`,
    performedById: actorId,
  });

  return user;
}

export async function update(companyId: string, actorId: string, id: string, input: UpdateUserInput) {
  const existing = await usersRepository.findUserById(companyId, id);
  if (!existing) throw new AppError(404, 'User not found.');

  if (input.username && input.username !== existing.username) {
    await assertUsernameIsFree(input.username, id);
  }
  if (input.email && input.email !== existing.email) {
    await assertEmailIsFree(input.email, id);
  }
  if (input.userGroupId && input.userGroupId !== existing.userGroup.id) {
    await resolveUserGroup(companyId, input.userGroupId);
  }

  const passwordHash = input.password ? await bcrypt.hash(input.password, SALT_ROUNDS) : undefined;

  // Overrides are only touched when the caller sends them — an edit of the profile alone leaves the
  // user's extra permissions alone. Written before the user row is re-read so the response reflects them.
  if (input.permissionOverrides) {
    await usersRepository.replacePermissionOverrides(id, dedupeGrants(input.permissionOverrides));

    await logActivity({
      companyId,
      module: ACTIVITY_MODULE,
      referenceId: id,
      action: 'UPDATE_PERMISSIONS',
      description: `Permission overrides updated for "${existing.fullName}".`,
      performedById: actorId,
    });
  }

  const user = await usersRepository.updateUser(id, {
    userGroupId: input.userGroupId,
    fullName: input.fullName,
    username: input.username,
    mobile: input.mobile,
    isActive: input.isActive,
    // Optional fields are only written when the caller sent them, so a partial update cannot clear
    // a value it never mentioned; an empty string is an explicit "remove this".
    ...(input.employeeCode === undefined ? {} : { employeeCode: input.employeeCode || null }),
    ...(input.email === undefined ? {} : { email: input.email || null }),
    ...(input.city === undefined ? {} : { city: input.city || null }),
    ...(passwordHash ? { passwordHash } : {}),
  });

  await logActivity({
    companyId,
    module: ACTIVITY_MODULE,
    referenceId: user.id,
    action: 'UPDATE',
    description: `User "${user.fullName}" updated.`,
    performedById: actorId,
  });

  return user;
}

export async function updateProfilePhoto(companyId: string, actorId: string, id: string, filePath: string) {
  const existing = await usersRepository.findUserById(companyId, id);
  if (!existing) throw new AppError(404, 'User not found.');

  const user = await usersRepository.updateUser(id, { profilePhoto: filePath });

  await logActivity({
    companyId,
    module: ACTIVITY_MODULE,
    referenceId: id,
    action: 'UPDATE',
    description: `Profile photo updated for "${user.fullName}".`,
    performedById: actorId,
  });

  return user;
}

/**
 * Profile photos are staff PII, so they are served through an authenticated route rather than the
 * public /uploads mount — the same treatment order documents and task photos get.
 */
export async function getProfilePhotoPath(companyId: string, id: string): Promise<string> {
  const user = await usersRepository.findUserById(companyId, id);
  if (!user) throw new AppError(404, 'User not found.');
  if (!user.profilePhoto) throw new AppError(404, 'This user has no profile photo.');
  return user.profilePhoto;
}

export async function remove(companyId: string, actorId: string, id: string): Promise<void> {
  const existing = await usersRepository.findUserById(companyId, id);
  if (!existing) throw new AppError(404, 'User not found.');

  await usersRepository.softDeleteUser(id);

  await logActivity({
    companyId,
    module: ACTIVITY_MODULE,
    referenceId: id,
    action: 'DELETE',
    description: `User "${existing.fullName}" deleted.`,
    performedById: actorId,
  });
}
