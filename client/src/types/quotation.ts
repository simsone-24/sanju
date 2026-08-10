import type { EnquiryStatus } from './enquiry';
import type { OrderStatus } from './order';

export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'REVISED';

export type QuotationSource = 'ENQUIRY' | 'CUSTOMER' | 'ORDER' | 'MANUAL';

export interface QuotationItem {
  id: string;
  itemName: string;
  description: string | null;
  quantity: string;
  unit: string | null;
  rate: string;
  amount: string;
  sortOrder: number;
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
  enquiry: { id: string; enquiryNumber: string; status: EnquiryStatus } | null;
  customer: { id: string; customerName: string } | null;
  order: { id: string; orderNumber: string } | null;
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
  id: string;
  fullName: string;
}

export interface QuotationListItem {
  id: string;
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
  recipient: QuotationRecipient;
  event: QuotationEvent | null;
  owner: QuotationOwner | null;
  link: QuotationLink;
}

export interface QuotationImage {
  id: string;
  fileName: string;
  filePath: string;
  caption: string | null;
  sortOrder: number;
}

// One entry in the revision-history drawer on the quotation view page.
export interface QuotationRevision {
  id: string;
  quotationNumber: string;
  version: number;
  quotationDate: string;
  totalAmount: string;
  status: QuotationStatus;
  createdAt: string;
  createdBy: { id: string; fullName: string } | null;
}

export interface QuotationDetail extends QuotationListItem {
  remarks: string | null;
  updatedAt: string;
  createdBy: { id: string; fullName: string } | null;
  whatsappNumber: string | null;
  items: QuotationItem[];
  images: QuotationImage[];
  /** Every revision raised against the same enquiry, newest first. Empty for standalone quotations. */
  revisions: QuotationRevision[];
  /** The order this quotation became, if it has already been converted. */
  convertedOrder: { id: string; orderNumber: string; status: OrderStatus } | null;
  /** The company's standing terms (Settings → Company Info), printed alongside the notes. */
  termsAndConditions: string | null;
}

export interface QuotationTimelineEntry {
  id: string;
  action: string;
  description: string | null;
  performedAt: string;
  performedBy: { id: string; fullName: string } | null;
}

export interface QuotationItemInput {
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  rate: number;
  sortOrder?: number;
}

export interface ManualCustomerInput {
  name?: string;
  phone?: string;
  whatsapp: string;
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
  enquiryId?: string;
  customerId?: string;
  orderId?: string;
  manualCustomer?: ManualCustomerInput;
  quotationDate?: string;
  discount?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  remarks?: string;
  items: QuotationItemInput[];
}

export interface UpdateQuotationInput {
  status?: QuotationStatus;
  quotationDate?: string;
  discount?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  remarks?: string;
  manualCustomer?: ManualCustomerInput;
  items?: QuotationItemInput[];
}

// One row per enquiry on the Quotations module's default (grouped) list — carries only the
// enquiry's latest quotation revision; older ones live on the enquiry's own page.
export interface QuotationEnquiryGroup {
  kind: 'ENQUIRY';
  enquiry: {
    id: string;
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
    id: string;
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
  enquiryId?: string;
  customerId?: string;
  orderId?: string;
  /** Enquiry's assigned user for enquiry-sourced quotations, creator for standalone ones. */
  assignedUserId?: string;
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
