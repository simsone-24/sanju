export interface AuditLogUser {
  id: number;
  fullName: string;
  username: string;
}

/** One entry of the activity log — what happened, to which record, who did it, and when. */
export interface AuditLogEntry {
  id: number;
  /** Which part of the system acted, e.g. `ORDERS`. Free-form: it grows as modules start logging. */
  module: string;
  /** What was done, e.g. `STATUS_CHANGE`. */
  action: string;
  /** The id of the record the action was on (an order id for ORDERS, an enquiry id for ENQUIRIES …). */
  referenceId: number;
  description: string | null;
  /** Structured detail some entries carry — e.g. the from / to of a status change. */
  metadata: unknown;
  performedAt: string;
  performedBy: AuditLogUser | null;
}

export interface ListAuditLogsParams {
  page: number;
  limit: number;
  search?: string;
  module?: string;
  action?: string;
  userId?: number;
  /** ISO timestamps — the start and end of the chosen local days. */
  dateFrom?: string;
  dateTo?: string;
}

/** The modules and actions that actually appear in the log, for the filter dropdowns. */
export interface AuditLogFilterOptions {
  modules: string[];
  actions: string[];
}

/** The kinds of record the Deleted Items tab can list. */
export type DeletedItemType = 'ENQUIRIES' | 'QUOTATIONS' | 'ORDERS' | 'PAYMENTS' | 'EXPENSES' | 'USERS';

/** One deleted record, in the same shape whatever its kind. */
export interface DeletedItemRow {
  id: number;
  /** The record's own number or name — ENQ-2026-00012, a receipt number, a username. */
  reference: string;
  /** Who or what it was about — usually the customer. */
  title: string;
  detail: string | null;
  /** Money value as a decimal string, for the kinds that have one. */
  amount: string | null;
  status: string | null;
  deletedAt: string;
  /** Who deleted it, from the audit log; null when no entry names anyone. */
  deletedBy: { id: number; fullName: string } | null;
  /** Set when the record went because its parent was deleted — e.g. "Enquiry ENQ-2026-00012". */
  deletedWith: string | null;
}

export interface DeletedItemTypeSummary {
  type: DeletedItemType;
  label: string;
  count: number;
}

export interface ListDeletedItemsParams {
  type: DeletedItemType;
  page: number;
  limit: number;
  search?: string;
}

// ---------------------------------------------------------------------------------------------
// One deleted record in full, for its view page. Generic — labelled sections, related records and
// history — so a single page shows every kind.
// ---------------------------------------------------------------------------------------------

/** How a field's value is rendered. */
export type DetailFieldFormat = 'text' | 'currency' | 'date' | 'datetime' | 'badge';

/** Which status vocabulary a `badge` field belongs to. */
export type DetailBadgeType = 'enquiry' | 'quotation' | 'order' | 'paymentTracker';

export interface DetailField {
  label: string;
  value: string | null;
  format: DetailFieldFormat;
  badge?: DetailBadgeType;
}

export interface DetailSection {
  title: string;
  fields: DetailField[];
}

/**
 * What restoring the record would do with a related one: `returns` — it was deleted together with
 * this record and comes back with it; `stays_deleted` — it was deleted on its own and stays deleted;
 * `live` — it was never deleted.
 */
export type RelatedRestoreEffect = 'returns' | 'stays_deleted' | 'live';

export interface RelatedItem {
  reference: string;
  description: string | null;
  amount: string | null;
  status: string | null;
  badge?: DetailBadgeType;
  effect: RelatedRestoreEffect;
}

export interface RelatedGroup {
  title: string;
  items: RelatedItem[];
}

export interface DeletedItemHistoryEntry {
  id: number;
  module: string;
  action: string;
  description: string | null;
  performedAt: string;
  performedBy: { id: number; fullName: string } | null;
}

export interface DeletedItemDetail {
  type: DeletedItemType;
  id: number;
  reference: string;
  title: string;
  amount: string | null;
  deletedAt: string;
  deletedBy: { id: number; fullName: string } | null;
  deletedWith: string | null;
  sections: DetailSection[];
  related: RelatedGroup[];
  history: DeletedItemHistoryEntry[];
}
