import { NextFunction, Request, Response } from 'express';
import { ModuleName, PermissionAction } from '../modules/permissions/catalog';
import { AppError } from '../utils/AppError';

export interface PermissionRequirement {
  module: ModuleName;
  action: PermissionAction;
  /**
   * Restricts the requirement to requests the predicate matches — used where one endpoint carries
   * several documented actions (e.g. a status change to CANCELLED needs Cancel Order, every other
   * transition needs Edit).
   */
  when?: (req: Request) => boolean;
}

const FORBIDDEN_MESSAGE = 'You do not have permission to perform this action.';

function isGranted(req: Request, module: ModuleName, action: PermissionAction): boolean {
  const permission = req.user?.permissions.find((entry) => entry.module === module);
  return permission?.actions.includes(action) ?? false;
}

/** Requires one permission for every request that reaches the route. */
export function authorize(module: ModuleName, action: PermissionAction) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!isGranted(req, module, action)) {
      next(new AppError(403, FORBIDDEN_MESSAGE));
      return;
    }
    next();
  };
}

/**
 * Requires a permission only for the requests the predicate matches, and lets everything else
 * through — chain one per branch so each documented action guards exactly the requests it owns.
 */
export function authorizeWhen(
  predicate: (req: Request) => boolean,
  module: ModuleName,
  action: PermissionAction,
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (predicate(req) && !isGranted(req, module, action)) {
      next(new AppError(403, FORBIDDEN_MESSAGE));
      return;
    }
    next();
  };
}

/**
 * Passes when any one of the requirements is satisfied — for endpoints reachable through more than
 * one permission (a task item can be updated by someone who may edit the plan, or, for the
 * checklist fields alone, by someone who may only update the checklist).
 */
export function authorizeAny(...requirements: PermissionRequirement[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const satisfied = requirements.some(
      (requirement) =>
        (requirement.when?.(req) ?? true) && isGranted(req, requirement.module, requirement.action),
    );

    if (!satisfied) {
      next(new AppError(403, FORBIDDEN_MESSAGE));
      return;
    }
    next();
  };
}
