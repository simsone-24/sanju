import type { QuotationStatus } from '../../types/quotation';

// "md files/Enquiry/flow.md" §3 — moving an enquiry to Order Confirmed without a settled quotation
// behind it is worth pausing on, but it is never blocked: the two checks below produce a message
// the user reads and confirms past. Applies uniformly to a status change on an existing enquiry and
// to picking Order Confirmed while creating a new one.
export const NO_QUOTATION_CONFIRM_MESSAGE =
  "This Enquiry hasn't a Quotation. Please confirm before moving status to Order Confirmed.";

export const QUOTATION_NOT_APPROVED_CONFIRM_MESSAGE =
  "This Enquiry's Quotation is not approved. Please confirm before moving status to Order Confirmed.";

/**
 * The warning to confirm before moving an enquiry to Order Confirmed, or `null` when the enquiry
 * already has an approved quotation and the transition needs no extra confirmation.
 *
 * The checks are sequential: existence first, then approval.
 */
export function orderConfirmedWarning(quotationStatuses: QuotationStatus[]): string | null {
  if (quotationStatuses.length === 0) return NO_QUOTATION_CONFIRM_MESSAGE;
  if (!quotationStatuses.includes('APPROVED')) return QUOTATION_NOT_APPROVED_CONFIRM_MESSAGE;
  return null;
}
