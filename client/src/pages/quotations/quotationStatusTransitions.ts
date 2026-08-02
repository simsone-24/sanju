import type { QuotationStatus } from '../../types/quotation';

// Mirrors EDITABLE_QUOTATION_STATUSES in server/src/modules/quotations/service.ts. APPROVED is
// editable because extra work is routinely agreed late in the event and the quotation's items are
// the only itemisation an order has. REVISED (superseded by a newer version) and REJECTED (the
// enquiry was lost) stay locked — editing either rewrites a dead document rather than the live one.
const EDITABLE_QUOTATION_STATUSES: ReadonlySet<QuotationStatus> = new Set<QuotationStatus>([
  'DRAFT',
  'SENT',
  'APPROVED',
]);

export function isQuotationEditable(status: QuotationStatus): boolean {
  return EDITABLE_QUOTATION_STATUSES.has(status);
}
