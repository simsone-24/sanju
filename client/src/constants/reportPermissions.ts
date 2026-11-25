import type { PermissionAction } from '../types/permission';

/**
 * The Reports page's tabs, one permission each (server: permissions/catalog.ts, REPORTS module).
 * There is no page-wide View: the page and its sidebar entry show when any of these is granted.
 */
export const REPORT_TAB_ACTIONS: readonly PermissionAction[] = [
  'canViewRevenueReport',
  'canViewOutstandingReport',
  'canViewCustomerReport',
  'canViewOrderReport',
  'canViewExpenseReport',
];
