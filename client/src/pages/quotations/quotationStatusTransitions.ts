import type { QuotationStatus } from '../../types/quotation';

/**
 * A quotation is editable at every stage — "md files/Enquiry/enq.md" §6 ("No locking after quotation
 * creation", "No locking after quotation confirmation") and §7, which forbids "Cannot edit quotation
 * after sending" and "Cannot edit quotation after discussion" as rules.
 *
 * The status set this used to hold mirrored EDITABLE_QUOTATION_STATUSES in
 * server/src/modules/quotations/service.ts, which was removed with it. Kept as a function so the
 * call sites stay put if a future rule needs one.
 */
export function isQuotationEditable(_status: QuotationStatus): boolean {
  return true;
}
