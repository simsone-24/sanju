import { AppError } from '../../utils/AppError';
import {
  ModuleName,
  PERMISSION_CATALOG,
  PermissionAction,
  PermissionModuleDefinition,
  isCatalogPermission,
} from './catalog';
import { EffectivePermission, PermissionGrant } from './types';

export function getCatalog(): PermissionModuleDefinition[] {
  return PERMISSION_CATALOG;
}

export function hasPermission(
  actor: { permissions: EffectivePermission[] },
  module: ModuleName,
  action: PermissionAction,
): boolean {
  return actor.permissions.some(
    (permission) => permission.module === module && permission.actions.includes(action),
  );
}

/**
 * The service-layer counterpart of the authorize() middleware, for rules that can only be decided
 * once the stored record is in hand (e.g. reassigning an enquiry needs Assign, but only when the
 * assignee actually changes — the request payload alone cannot tell).
 */
export function requirePermission(
  actor: { permissions: EffectivePermission[] },
  module: ModuleName,
  action: PermissionAction,
): void {
  if (!hasPermission(actor, module, action)) {
    throw new AppError(403, 'You do not have permission to perform this action.');
  }
}

/**
 * Drops repeated grants from a submitted set, so the unique (owner, module, action) key can never
 * be hit by a single request. Shared by user groups and user overrides — both store grants the
 * same way.
 */
export function dedupeGrants(grants: PermissionGrant[]): PermissionGrant[] {
  const seen = new Set<string>();
  return grants.filter((grant) => {
    const key = `${grant.module}:${grant.action}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Merges a user's group permissions with their personal overrides — user.md §Permission Resolution
 * Logic. Overrides are additional grants layered on top of the group ("Sometimes a single user
 * requires additional permissions without changing the permissions of the entire User Group"), so
 * the result is the union of both sets: an override outranks the group's silence, and anything
 * neither grants stays denied.
 *
 * Both sets are filtered through the catalog so a stale row can never widen access.
 */
export function resolveEffectivePermissions(
  groupPermissions: PermissionGrant[],
  userOverrides: PermissionGrant[],
): EffectivePermission[] {
  const grantedByModule = new Map<string, Set<string>>();

  for (const grant of [...groupPermissions, ...userOverrides]) {
    if (!isCatalogPermission(grant.module, grant.action)) continue;
    const actions = grantedByModule.get(grant.module) ?? new Set<string>();
    actions.add(grant.action);
    grantedByModule.set(grant.module, actions);
  }

  // Emitted in catalog order rather than insertion order, so the payload reads the same for every
  // user regardless of the order their grants were saved in.
  return PERMISSION_CATALOG.reduce<EffectivePermission[]>((result, definition) => {
    const granted = grantedByModule.get(definition.module);
    if (!granted?.size) return result;

    result.push({
      module: definition.module as ModuleName,
      actions: definition.actions
        .filter((action) => granted.has(action.key))
        .map((action) => action.key as PermissionAction),
    });
    return result;
  }, []);
}
