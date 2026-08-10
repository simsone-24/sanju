import bcrypt from 'bcrypt';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { resolveEffectivePermissions } from '../permissions/service';
import { EffectivePermission } from '../permissions/types';
import * as authRepository from './repository';
import { AuthenticatedProfile, AuthTokens, LoginInput } from './types';

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

export async function me(userId: string): Promise<AuthenticatedProfile> {
  const user = await authRepository.findUserById(userId);
  if (!user || !user.isActive) {
    throw new AppError(401, 'Session is no longer valid.');
  }
  return toProfile(user);
}

export async function logout(userId: string, companyId: string): Promise<void> {
  await logActivity({
    companyId,
    module: 'AUTH',
    referenceId: userId,
    action: 'LOGOUT',
    performedById: userId,
  });
}
