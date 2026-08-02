import type { QuotationStatus } from '../../types/quotation';

// Statuses whose PDF can still be sent to the customer as if it were the live document — a
// REVISED (superseded by a newer version) or REJECTED (already declined) quotation must not be
// re-shared. Mirrors the same rule applied on the quotation view page and the preview dialog.
const SHAREABLE_QUOTATION_STATUSES: ReadonlySet<QuotationStatus> = new Set<QuotationStatus>([
  'DRAFT',
  'SENT',
  'APPROVED',
]);

export function canShareQuotation(status: QuotationStatus): boolean {
  return SHAREABLE_QUOTATION_STATUSES.has(status);
}

export interface QuotationWhatsAppTarget {
  quotationNumber: string;
  recipientName: string | null;
  whatsapp: string | null;
  phone: string | null;
}

// wa.me link with the message pre-composed. Returns null when neither a WhatsApp number nor a
// phone number is on record, so callers can say why nothing happened instead of opening a blank
// WhatsApp tab.
export function buildQuotationWhatsAppLink(target: QuotationWhatsAppTarget): string | null {
  const number = (target.whatsapp ?? target.phone ?? '').replace(/\D/g, '');
  if (!number) return null;
  const name = target.recipientName ?? 'there';
  const message = `Hello ${name}, thank you for contacting us. Please find your quotation ${target.quotationNumber}. Regards.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
