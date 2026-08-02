import { useAuthStore } from '../store/authStore';
import type { EffectivePermission, ModuleName, PermissionAction } from '../types/permission';

export type { ModuleName, PermissionAction } from '../types/permission';

// Plain function for checking permissions (used in loops/filters where hooks can't be called).
// UI-only — purely for conditional rendering (hide a button a group can't use). The backend's
// authorize() middleware is the actual enforcer regardless of what this returns.
export function hasPermission(
  permissions: EffectivePermission[] | undefined,
  module: ModuleName,
  action: PermissionAction,
): boolean {
  const entry = permissions?.find((permission) => permission.module === module);
  // actions is optional-chained as well: this runs for every nav item on every render, and a
  // profile that does not carry the expected shape should deny the action, not crash the shell.
  return entry?.actions?.includes(action) ?? false;
}

// Hook version for component use.
export function usePermission(module: ModuleName, action: PermissionAction): boolean {
  const permissions = useAuthStore((state) => state.user?.permissions);
  return hasPermission(permissions, module, action);
}
