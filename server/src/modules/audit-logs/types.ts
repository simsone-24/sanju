export interface ListAuditLogsParams {
  companyId: number;
  page: number;
  limit: number;
  /** Matched against the entry's description. */
  search?: string;
  module?: string;
  action?: string;
  /** The user who performed the action. */
  userId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * The kinds of record the Deleted Items list can show — the ones the application can soft-delete
 * today. Adding a kind is one entry here plus one adapter in deletedItems.repository.ts.
 */
export const DELETED_ITEM_TYPES = ['ENQUIRIES', 'QUOTATIONS', 'ORDERS', 'PAYMENTS', 'EXPENSES', 'USERS'] as const;

export type DeletedItemType = (typeof DELETED_ITEM_TYPES)[number];

export interface ListDeletedItemsParams {
  companyId: number;
  type: DeletedItemType;
  page: number;
  limit: number;
  search?: string;
}

/** One deleted record, in the same shape whatever its kind, so one table can show them all. */
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
  deletedAt: Date;
  /** Who deleted it, from the log; null when no log entry names anyone. */
  deletedBy: { id: number; fullName: string } | null;
  /** Set when the record went because its parent was deleted — e.g. "Enquiry ENQ-2026-00012". */
  deletedWith: string | null;
}

export interface DeletedItemTypeSummary {
  type: DeletedItemType;
  label: string;
  count: number;
}

// ---------------------------------------------------------------------------------------------
// The view page for one deleted record. The shape is generic — labelled sections, related records
// and history — so a single page can show every kind; each kind's own fields are chosen in
// deletedItemDetail.repository.ts.
// ---------------------------------------------------------------------------------------------

/** How the page should render a field's value. */
export type DetailFieldFormat = 'text' | 'currency' | 'date' | 'datetime' | 'badge';

/** Which status vocabulary a `badge` field belongs to (the client's StatusBadge types). */
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
 * What a restore would do with a related record:
 * - `returns` — it was deleted together with this record, so restoring brings it back;
 * - `stays_deleted` — it was deleted on its own at another time, so restoring leaves it deleted;
 * - `live` — it was never deleted.
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
  performedAt: Date;
  performedBy: { id: number; fullName: string } | null;
}

export interface DeletedItemDetail {
  type: DeletedItemType;
  id: number;
  reference: string;
  title: string;
  /** The record's headline money value as a decimal string, for the kinds that have one. */
  amount: string | null;
  deletedAt: Date;
  deletedBy: { id: number; fullName: string } | null;
  deletedWith: string | null;
  sections: DetailSection[];
  related: RelatedGroup[];
  history: DeletedItemHistoryEntry[];
}
