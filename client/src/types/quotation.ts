import type { EnquiryStatus } from './enquiry';
import type { OrderStatus } from './order';

export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'REVISED';

export type QuotationSource = 'ENQUIRY' | 'CUSTOMER' | 'ORDER' | 'MANUAL';

// A flat, individually priced item — the original quotation layout.
export interface QuotationItem {
  id: number;
  itemName: string;
  description: string | null;
  quantity: string;
  unit: string | null;
  rate: string;
  amount: string;
  sortOrder: number;
}

// An item listed under a section: a description with a free-text Size/Qty ("8nos"). The section
// carries the price.
export interface QuotationSectionItem {
  id: number;
  description: string;
  sizeQty: string | null;
  sortOrder: number;
}

// A named group of items priced as one amount, e.g. "EVENING STAGE" — 1,20,000.
export interface QuotationSection {
  id: number;
  title: string | null;
  amount: string;
  sortOrder: number;
  items: QuotationSectionItem[];
}

// Normalized recipient, resolved server-side from whichever source the quotation came from.
export interface QuotationRecipient {
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  gst: string | null;
}

export interface QuotationLink {
  enquiry: {
    id: number;
    enquiryNumber: string;
    status: EnquiryStatus;
    /** The enquiry's Final Budget advance, used to seed/align the quotation's advance. */
    advanceAmount: string | null;
  } | null;
  customer: { id: number; customerName: string } | null;
  order: { id: number; orderNumber: string } | null;
}

// The event the quotation is priced for. Only an enquiry describes one, so Customer/Order/Manual
// quotations carry `null` here.
export interface QuotationEvent {
  eventType: string;
  colorCode: string | null;
  eventName: string | null;
  eventDate: string | null;
  mahal: string | null;
  venue: string | null;
}

/** Enquiry's assigned user, or the quotation's creator when there is no enquiry. */
export interface QuotationOwner {
  id: number;
  fullName: string;
}

export interface QuotationListItem {
  id: number;
  source: QuotationSource;
  quotationNumber: string;
  version: number;
  quotationDate: string;
  subtotal: string;
  discount: string;
  cgstPercent: string;
  sgstPercent: string;
  tax: string;
  totalAmount: string;
  status: QuotationStatus;
  pdfPath: string | null;
  createdAt: string;
  /** Last edit or status change — the "Last Updated" column on the enquiry's quotation table. */
  updatedAt: string;
  advanceAmount: string | null;
  recipient: QuotationRecipient;
  event: QuotationEvent | null;
  owner: QuotationOwner | null;
  link: QuotationLink;
}

export interface QuotationImage {
  id: number;
  fileName: string;
  filePath: string;
  caption: string | null;
  sortOrder: number;
}

// One entry in the revision-history drawer on the quotation view page.
export interface QuotationRevision {
  id: number;
  quotationNumber: string;
  version: number;
  quotationDate: string;
  totalAmount: string;
  status: QuotationStatus;
  createdAt: string;
  createdBy: { id: number; fullName: string } | null;
}

export interface QuotationDetail extends QuotationListItem {
  remarks: string | null;
  updatedAt: string;
  createdBy: { id: number; fullName: string } | null;
  whatsappNumber: string | null;
  /** Flat priced items; empty on a section-wise quotation. */
  items: QuotationItem[];
  /** Section-wise lines; empty on a flat quotation. */
  sections: QuotationSection[];
  /** The total spelled out, e.g. "Rupees Two Lakh Ninety Seven Thousand Only". */
  totalAmountInWords: string;
  images: QuotationImage[];
  /** Every revision raised against the same enquiry, newest first. Empty for standalone quotations. */
  revisions: QuotationRevision[];
  /** The order this quotation became, if it has already been converted. */
  convertedOrder: { id: number; orderNumber: string; status: OrderStatus } | null;
  /** The company's standing terms (Settings → Company Info), printed alongside the notes. */
  termsAndConditions: string | null;
  /** The advance amount agreed for this quotation. */
  advanceAmount: string | null;
}

export interface QuotationTimelineEntry {
  id: number;
  action: string;
  description: string | null;
  performedAt: string;
  performedBy: { id: number; fullName: string } | null;
}

export interface QuotationItemInput {
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  rate: number;
  sortOrder?: number;
}

export interface QuotationSectionInput {
  title?: string;
  amount: number;
  items: { description: string; sizeQty?: string }[];
}

export interface ManualCustomerInput {
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  gst?: string;
}

/** Statuses a quotation can be saved in from the form. REVISED is machine-set when a newer revision
 *  supersedes a quotation, so it is never a state a document can be created in. */
export type CreatableQuotationStatus = Exclude<QuotationStatus, 'REVISED'>;

export interface CreateQuotationInput {
  source: QuotationSource;
  status?: CreatableQuotationStatus;
  enquiryId?: number;
  customerId?: number;
  orderId?: number;
  manualCustomer?: ManualCustomerInput;
  quotationDate?: string;
  discount?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  /** Advance agreed against the quotation; shown on the form and stored with the document. */
  advanceAmount?: number;
  remarks?: string;
  /** Flat priced items or section-wise lines — at least one of the two. */
  items?: QuotationItemInput[];
  sections?: QuotationSectionInput[];
}

export interface UpdateQuotationInput {
  status?: QuotationStatus;
  quotationDate?: string;
  discount?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  advanceAmount?: number;
  remarks?: string;
  manualCustomer?: ManualCustomerInput;
  items?: QuotationItemInput[];
  sections?: QuotationSectionInput[];
}

// One row per enquiry on the Quotations module's default (grouped) list — carries only the
// enquiry's latest quotation revision; older ones live on the enquiry's own page.
export interface QuotationEnquiryGroup {
  kind: 'ENQUIRY';
  enquiry: {
    id: number;
    enquiryNumber: string;
    customerName: string;
    customerMobile: string;
    eventType: string;
    colorCode: string | null;
    eventName: string | null;
    eventDate: string | null;
    assignedUser: QuotationOwner | null;
  };
  quotationCount: number;
  latestQuotation: {
    id: number;
    quotationNumber: string;
    version: number;
    quotationDate: string;
    totalAmount: string;
    status: QuotationStatus;
  };
}

// Customer/Order/Manual-sourced quotations have no enquiry to group under, so they appear as
// individual rows alongside the enquiry groups.
export interface QuotationIndividualRow {
  kind: 'QUOTATION';
  quotation: QuotationListItem;
}

export type QuotationGroupedRow = QuotationEnquiryGroup | QuotationIndividualRow;

export interface ListQuotationsParams {
  page: number;
  limit: number;
  search?: string;
  source?: QuotationSource;
  status?: QuotationStatus;
  enquiryId?: number;
  customerId?: number;
  orderId?: number;
  /** Enquiry's assigned user for enquiry-sourced quotations, creator for standalone ones. */
  assignedUserId?: number;
  dateFrom?: string;
  dateTo?: string;
}

// KPI tiles above the Quotations list. `revenue` totals APPROVED quotations only.
export interface QuotationStats {
  draft: number;
  sent: number;
  approved: number;
  rejected: number;
  revenue: string;
}
