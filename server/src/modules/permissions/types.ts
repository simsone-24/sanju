import { ModuleName, PermissionAction } from './catalog';

/** One stored grant row — a user group permission or a user-level override. */
export interface PermissionGrant {
  module: string;
  action: string;
}

/** The permissions a signed-in user actually holds, grouped by module. */
export interface EffectivePermission {
  module: ModuleName;
  actions: PermissionAction[];
}
