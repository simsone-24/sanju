import { NextFunction, Request, Response } from 'express';
import { getUserWithPermissions } from '../modules/auth/repository';
import { effectivePermissionsFor } from '../modules/auth/service';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required.');
    }

    const token = header.slice('Bearer '.length);
    const payload = verifyAccessToken(token);

    const user = await getUserWithPermissions(payload.sub);
    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid or expired session.');
    }

    req.user = {
      id: user.id,
      companyId: user.companyId,
      userGroupId: user.userGroupId,
      userGroupName: user.userGroup.groupName,
      fullName: user.fullName,
      username: user.username,
      // Resolved per request rather than read from the token, so a change to the group's
      // permissions — or to this user's overrides — takes effect on the very next call
      // (user.md §User Group Rules: changes "automatically apply to all assigned users").
      permissions: effectivePermissionsFor(user),
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, 'Invalid or expired session.'));
  }
}
