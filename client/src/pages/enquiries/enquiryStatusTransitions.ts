import type { EnquiryStatus } from '../../types/enquiry';

// enquiry.md: "'Create Quotation' should only be displayed if a quotation has not yet been
// created (or according to the business rules)." Mirrors the server guard in
// quotations/service.ts create(): a quotation cannot be raised once the enquiry is ORDER_CONFIRMED
// (won) or ORDER_LOST (lost). Every earlier stage still allows a new quotation revision.
const QUOTATION_BLOCKED_STATUSES: ReadonlySet<EnquiryStatus> = new Set<EnquiryStatus>([
  'ORDER_CONFIRMED',
  'ORDER_LOST',
]);

export function canCreateQuotationForEnquiry(status: EnquiryStatus): boolean {
  return !QUOTATION_BLOCKED_STATUSES.has(status);
}

// The documented Enquiry → Appointment → Quotation → Order path (CLAUDE.md §Business Workflow),
// as the ordered stages the Enquiry Details progress tracker walks through. ORDER_LOST is
// deliberately absent: a lost enquiry didn't advance *into* a further stage, so the tracker shows
// a banner for it instead of a step.
export const ENQUIRY_STAGES: { key: EnquiryStatus; label: string }[] = [
  { key: 'PENDING', label: 'Enquiry Received' },
  { key: 'APPOINTMENT_FIXED', label: 'Appointment Fixed' },
  { key: 'QUOTATION_TO_SHARE', label: 'Quotation Ready' },
  { key: 'QUOTATION_SHARED', label: 'Quotation Shared' },
  { key: 'ORDER_CONFIRMED', label: 'Order Confirmed' },
];

/** Index of the stage an enquiry currently sits at, or -1 for a lost enquiry (no stage). */
export function enquiryStageIndex(status: EnquiryStatus): number {
  return ENQUIRY_STAGES.findIndex((stage) => stage.key === status);
}
