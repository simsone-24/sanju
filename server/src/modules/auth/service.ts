import bcrypt from 'bcrypt';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { resolveEffectivePermissions } from '../permissions/service';
import { EffectivePermission } from '../permissions/types';
import * as usersRepository from '../users/repository';
import * as authRepository from './repository';
import {
  AuthenticatedProfile,
  AuthTokens,
  ChangePasswordInput,
  LoginInput,
  UpdateProfileInput,
} from './types';

const SALT_ROUNDS = 10;

type UserWithAccess = NonNullable<Awaited<ReturnType<typeof authRepository.findUserById>>>;

export function effectivePermissionsFor(user: UserWithAccess): EffectivePermission[] {
  return resolveEffectivePermissions(user.userGroup.permissions, user.permissionOverrides);
}

function toProfile(user: UserWithAccess): AuthenticatedProfile {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    mobile: user.mobile,
    city: user.city,
    profilePhoto: user.profilePhoto,
    userGroup: { id: user.userGroup.id, groupName: user.userGroup.groupName },
    company: { id: user.company.id, companyName: user.company.companyName, logo: user.company.logo },
    permissions: effectivePermissionsFor(user),
  };
}

function issueTokens(user: UserWithAccess): AuthTokens {
  const accessToken = signAccessToken({
    sub: user.id,
    companyId: user.companyId,
    userGroupId: user.userGroupId,
    userGroupName: user.userGroup.groupName,
  });
  const refreshToken = signRefreshToken({ sub: user.id });
  return { accessToken, refreshToken };
}

export async function login(input: LoginInput): Promise<AuthTokens & { user: AuthenticatedProfile }> {
  // user.md §Login Credentials — users sign in with their username, not their email address.
  const user = await authRepository.findUserByUsername(input.username);
  // "Inactive users cannot log in" (§Validation Rules). The same generic message covers a missing
  // account, a wrong password and a disabled one, so the form never reveals which it was.
  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid username or password.');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, 'Invalid username or password.');
  }

  const tokens = issueTokens(user);

  await logActivity({
    companyId: user.companyId,
    module: 'AUTH',
    referenceId: user.id,
    action: 'LOGIN',
    description: `${user.fullName} logged in.`,
    performedById: user.id,
  });

  return { ...tokens, user: toProfile(user) };
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token.');
  }

  const user = await authRepository.findUserById(payload.sub);
  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid or expired refresh token.');
  }

  return issueTokens(user);
}

export async function me(userId: number): Promise<AuthenticatedProfile> {
  const user = await authRepository.findUserById(userId);
  if (!user || !user.isActive) {
    throw new AppError(401, 'Session is no longer valid.');
  }
  return toProfile(user);
}

async function requireActiveUser(userId: number): Promise<UserWithAccess> {
  const user = await authRepository.findUserById(userId);
  if (!user || !user.isActive) {
    throw new AppError(401, 'Session is no longer valid.');
  }
  return user;
}

export async function updateProfile(userId: number, input: UpdateProfileInput): Promise<AuthenticatedProfile> {
  const existing = await requireActiveUser(userId);

  if (input.email && input.email !== existing.email) {
    const owner = await usersRepository.findUserByEmail(input.email);
    if (owner && owner.id !== userId) {
      throw new AppError(409, 'A user with this email already exists.', [
        { field: 'email', message: 'Email is already in use.' },
      ]);
    }
  }

  const user = await authRepository.updateUser(userId, {
    fullName: input.fullName,
    mobile: input.mobile,
    // Optional fields are only written when sent; an empty string is an explicit "remove this".
    ...(input.email === undefined ? {} : { email: input.email || null }),
    ...(input.city === undefined ? {} : { city: input.city || null }),
  });

  await logActivity({
    companyId: user.companyId,
    module: 'USERS',
    referenceId: user.id,
    action: 'UPDATE',
    description: `${user.fullName} updated their own profile.`,
    performedById: user.id,
  });

  return toProfile(user);
}

export async function updateProfilePhoto(userId: number, filePath: string): Promise<AuthenticatedProfile> {
  await requireActiveUser(userId);
  const user = await authRepository.updateUser(userId, { profilePhoto: filePath });

  await logActivity({
    companyId: user.companyId,
    module: 'USERS',
    referenceId: user.id,
    action: 'UPDATE',
    description: `${user.fullName} updated their own profile photo.`,
    performedById: user.id,
  });

  return toProfile(user);
}

export async function getOwnProfilePhotoPath(userId: number): Promise<string> {
  const user = await requireActiveUser(userId);
  if (!user.profilePhoto) throw new AppError(404, 'You have no profile photo.');
  return user.profilePhoto;
}

export async function changePassword(userId: number, input: ChangePasswordInput): Promise<void> {
  const user = await requireActiveUser(userId);

  const currentMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!currentMatches) {
    throw new AppError(400, 'Current password is incorrect.', [
      { field: 'currentPassword', message: 'Current password is incorrect.' },
    ]);
  }

  const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  await authRepository.updateUser(userId, { passwordHash });

  await logActivity({
    companyId: user.companyId,
    module: 'USERS',
    referenceId: user.id,
    action: 'CHANGE_PASSWORD',
    description: `${user.fullName} changed their password.`,
    performedById: user.id,
  });
}

export async function logout(userId: number, companyId: number): Promise<void> {
  await logActivity({
    companyId,
    module: 'AUTH',
    referenceId: userId,
    action: 'LOGOUT',
    performedById: userId,
  });
}
