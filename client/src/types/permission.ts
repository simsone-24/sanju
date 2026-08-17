// Mirrors the server's permission catalog (server/src/modules/permissions/catalog.ts). The module
// and action keys are strings on both sides, so a module added to the catalog reaches this UI
// through GET /permissions/catalog with no change here.
export type ModuleName =
  | 'DASHBOARD'
  | 'ENQUIRIES'
  | 'QUOTATIONS'
  | 'ORDERS'
  | 'PLANNING'
  | 'PAYMENTS'
  | 'CUSTOMERS'
  | 'CALENDAR'
  | 'RENT'
  | 'REPORTS'
  | 'MASTERS'
  | 'SETTINGS';

export type PermissionAction =
  | 'canView'
  | 'canCreate'
  | 'canEdit'
  | 'canDelete'
  | 'canApprove'
  | 'canPrint'
  | 'canExport'
  | 'canAssign'
  | 'canChangeStatus'
  | 'canConvertToOrder'
  | 'canCancel'
  | 'canCompleteEvent'
  | 'canUpdateChecklist';

/** One granted permission — the unit stored against a user group or a user override. */
export interface PermissionGrant {
  module: ModuleName;
  action: PermissionAction;
}

export interface PermissionActionDefinition {
  key: PermissionAction;
  label: string;
}

/** A module and the actions it can grant, as described by the server's catalog. */
export interface PermissionModuleDefinition {
  module: ModuleName;
  label: string;
  description: string;
  actions: PermissionActionDefinition[];
}

/** The permissions a signed-in user holds, grouped by module. */
export interface EffectivePermission {
  module: ModuleName;
  actions: PermissionAction[];
}
