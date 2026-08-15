// Permission catalog — masters/user.md §Module Permissions + §Action-Level Permissions.
//
// This file is the single source of truth for which modules exist and which actions each one
// exposes. Permissions are persisted as (module, action) string rows rather than one column per
// action, so introducing a module or an action here needs no schema change and no migration —
// user.md §Benefits: "Supports future modules without database redesign".
//
// Only actions the application actually enforces are listed. user.md's action lists are examples
// ("Every module can define its own permissions based on business requirements"), and a checkbox
// that gates nothing would promise access control the app does not perform — so an action appears
// here only once a route or a UI affordance checks it. The `Enforced by` note on each module records
// where that check lives.

export const ModuleName = {
  DASHBOARD: 'DASHBOARD',
  ENQUIRIES: 'ENQUIRIES',
  QUOTATIONS: 'QUOTATIONS',
  ORDERS: 'ORDERS',
  PLANNING: 'PLANNING',
  PAYMENTS: 'PAYMENTS',
  CUSTOMERS: 'CUSTOMERS',
  CALENDAR: 'CALENDAR',
  REPORTS: 'REPORTS',
  MASTERS: 'MASTERS',
  SETTINGS: 'SETTINGS',
} as const;

export type ModuleName = (typeof ModuleName)[keyof typeof ModuleName];

// Action keys keep the `canX` naming the codebase already uses in authorize() and the client's
// usePermission(), so the move from fixed boolean columns to catalog rows changed the storage
// model without renaming a single existing permission check.
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

export interface PermissionActionDefinition {
  key: PermissionAction;
  /** Shown next to the checkbox in the permission editor — module-specific wording where user.md uses it. */
  label: string;
}

export interface PermissionModuleDefinition {
  module: ModuleName;
  label: string;
  description: string;
  actions: PermissionActionDefinition[];
}

const VIEW: PermissionActionDefinition = { key: 'canView', label: 'View' };
const CREATE: PermissionActionDefinition = { key: 'canCreate', label: 'Create' };
const EDIT: PermissionActionDefinition = { key: 'canEdit', label: 'Edit' };
const DELETE: PermissionActionDefinition = { key: 'canDelete', label: 'Delete' };
const EXPORT: PermissionActionDefinition = { key: 'canExport', label: 'Export' };
const PRINT: PermissionActionDefinition = { key: 'canPrint', label: 'Print' };

export const PERMISSION_CATALOG: PermissionModuleDefinition[] = [
  {
    module: ModuleName.DASHBOARD,
    label: 'Dashboard',
    description: 'Home dashboard and summary widgets',
    // Enforced by: the sidebar/nav gate — the dashboard renders other modules' data, each of which
    // is authorized on its own endpoint, so there is no dashboard route of its own to guard.
    actions: [VIEW],
  },
  {
    module: ModuleName.ENQUIRIES,
    label: 'Enquiries',
    description: 'Customer enquiries, appointments and follow-ups',
    // Enforced by: modules/enquiries/routes.ts (canAssign on the assignment field of PUT /:id,
    // canChangeStatus on PATCH /:id/status, canDelete on DELETE /:id) and modules/orders/routes.ts
    // (canConvertToOrder on the conversion endpoints).
    actions: [
      VIEW,
      CREATE,
      EDIT,
      DELETE,
      { key: 'canAssign', label: 'Assign' },
      { key: 'canChangeStatus', label: 'Change Status' },
      { key: 'canConvertToOrder', label: 'Convert to Order' },
      EXPORT,
    ],
  },
  {
    module: ModuleName.QUOTATIONS,
    label: 'Quotations',
    description: 'Quotations, revisions and approvals',
    // Enforced by: modules/quotations/routes.ts.
    actions: [VIEW, CREATE, EDIT, { key: 'canApprove', label: 'Approve' }, PRINT, EXPORT],
  },
  {
    module: ModuleName.ORDERS,
    label: 'Orders',
    description: 'Confirmed orders, event execution and documents',
    // Enforced by: modules/orders/routes.ts — canCancel and canCompleteEvent guard those two status
    // transitions on PATCH /:id/status, every other transition stays on canEdit.
    actions: [
      VIEW,
      CREATE,
      EDIT,
      { key: 'canCancel', label: 'Cancel Order' },
      { key: 'canCompleteEvent', label: 'Complete Event' },
      EXPORT,
    ],
  },
  {
    module: ModuleName.PLANNING,
    label: 'Task Management',
    description: 'Task plan groups, task items and completion photos',
    // Enforced by: modules/task-plan/routes.ts — canUpdateChecklist lets a worker move a task
    // through its statuses and attach a proof photo without the full edit rights that would also
    // let them rename or restructure the plan (user.md §Worker).
    actions: [VIEW, CREATE, EDIT, DELETE, { key: 'canUpdateChecklist', label: 'Update Checklist' }],
  },
  {
    module: ModuleName.PAYMENTS,
    label: 'Payment Tracker',
    description: 'Payments received, payment status and invoices',
    // Enforced by: modules/payments, modules/payment-tracker and modules/invoices routes.
    actions: [
      VIEW,
      { key: 'canCreate', label: 'Create Payment' },
      { key: 'canEdit', label: 'Edit Payment' },
      { key: 'canPrint', label: 'Print Receipt' },
      EXPORT,
    ],
  },
  {
    module: ModuleName.CUSTOMERS,
    label: 'Customers',
    description: 'Customer directory and order history',
    // Enforced by: modules/customers/routes.ts. Customer records are still created only by the
    // enquiry workflow (no create/delete endpoint exists) — but once linked, correcting a
    // customer's own contact details (name, mobile, WhatsApp, email, address, city) is Edit,
    // reachable from the customer profile and from the Enquiry form's Existing Customer step.
    actions: [VIEW, EDIT, EXPORT],
  },
  {
    module: ModuleName.CALENDAR,
    label: 'Calendar',
    description: 'Event calendar for confirmed orders',
    // Enforced by: modules/calendar/routes.ts.
    actions: [VIEW],
  },
  {
    module: ModuleName.REPORTS,
    label: 'Reports',
    description: 'Revenue, outstanding, customer and event reports',
    // Enforced by: modules/reports/routes.ts.
    actions: [VIEW, EXPORT],
  },
  {
    module: ModuleName.MASTERS,
    label: 'Masters',
    description: 'User groups, users and event types',
    // Enforced by: modules/user-groups, modules/users and modules/event-types routes.
    actions: [VIEW, CREATE, EDIT, DELETE],
  },
  {
    module: ModuleName.SETTINGS,
    label: 'Company Settings',
    description: 'Company profile, branding and banking details',
    // Enforced by: modules/settings/routes.ts.
    actions: [VIEW, EDIT],
  },
];

const ACTIONS_BY_MODULE = new Map<string, ReadonlySet<string>>(
  PERMISSION_CATALOG.map((definition) => [
    definition.module,
    new Set(definition.actions.map((action) => action.key)),
  ]),
);

/**
 * Whether a (module, action) pair exists in the catalog. Stored rows are always filtered through
 * this, so a permission left behind by a module that has since been removed or renamed grants
 * nothing until it is cleaned up.
 */
export function isCatalogPermission(module: string, action: string): boolean {
  return ACTIONS_BY_MODULE.get(module)?.has(action) ?? false;
}
