// How the log's raw keys read on screen. The server stores plain strings (`PAYMENT_TRACKER`,
// `STATUS_CHANGE`) and new ones appear as modules start logging, so anything not listed here falls
// back to a readable form of the key instead of showing nothing.

const MODULE_LABELS: Record<string, string> = {
  AUTH: 'Login / Logout',
  CUSTOMERS: 'Customers',
  ENQUIRIES: 'Enquiries',
  EXPENSES: 'Expenses',
  INVOICES: 'Invoices',
  MASTERS: 'Masters',
  ORDERS: 'Orders',
  PAYMENT_TRACKER: 'Payment Tracker',
  PAYMENTS: 'Payments',
  QUOTATIONS: 'Quotations',
  RENT: 'Rent',
  SETTINGS: 'Settings',
  USERS: 'Users',
};

const ACTION_LABELS: Record<string, string> = {
  UPDATE_PERMISSIONS: 'Permission Change',
};

export type AuditActionColor = 'default' | 'success' | 'info' | 'warning' | 'error' | 'primary';

const ACTION_COLORS: Record<string, AuditActionColor> = {
  CREATE: 'success',
  APPROVE: 'success',
  RESTORE: 'success',
  UPDATE: 'info',
  UPDATE_PERMISSIONS: 'info',
  STATUS_CHANGE: 'warning',
  ORDER_CONVERSION: 'warning',
  PAYMENT: 'primary',
  DELETE: 'error',
};

/** `STATUS_CHANGE` → `Status Change`. */
function humanize(key: string): string {
  return key
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function moduleLabel(module: string): string {
  return MODULE_LABELS[module] ?? humanize(module);
}

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? humanize(action);
}

export function actionColor(action: string): AuditActionColor {
  return ACTION_COLORS[action] ?? 'default';
}

// Where the record an entry is about can be opened. Only modules whose `referenceId` is the id the
// page's own route uses are listed; the rest (payments, rent, settings …) show the id without a link.
const RECORD_PATHS: Record<string, (id: number) => string> = {
  ORDERS: (id) => `/orders/${id}`,
  QUOTATIONS: (id) => `/quotations/${id}`,
  ENQUIRIES: (id) => `/enquiries/${id}`,
  PAYMENT_TRACKER: (id) => `/payment-tracker/${id}`,
  CUSTOMERS: (id) => `/customers/${id}`,
};

export function recordPath(module: string, referenceId: number): string | null {
  return RECORD_PATHS[module]?.(referenceId) ?? null;
}
