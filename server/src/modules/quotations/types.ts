import { QuotationSource, QuotationStatus } from '@prisma/client';

export interface QuotationItemInput {
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  rate: number;
  sortOrder?: number;
}

// MANUAL-source quotations capture a lightweight customer snapshot instead of linking a record —
// see "md files/Quotation/quotation.md" §Mode B.
export interface ManualCustomerInput {
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  gst?: string;
}

export interface CreateQuotationInput {
  source: QuotationSource;
  enquiryId?: string;
  customerId?: string;
  orderId?: string;
  manualCustomer?: ManualCustomerInput;
  quotationDate?: Date;
  discount?: number;
  // CGST and SGST rates (percent). Their amounts are derived server-side.
  cgstPercent?: number;
  sgstPercent?: number;
  remarks?: string;
  items: QuotationItemInput[];
}

export interface UpdateQuotationInput {
  quotationDate?: Date;
  discount?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  remarks?: string;
  manualCustomer?: ManualCustomerInput;
  items?: QuotationItemInput[];
}

export interface ListQuotationsParams {
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  source?: QuotationSource;
  status?: QuotationStatus;
  enquiryId?: string;
  customerId?: string;
  orderId?: string;
  /**
   * The user responsible for the quotation: the source enquiry's assigned user for ENQUIRY-sourced
   * quotations, and the creator for standalone (Customer/Order/Manual) ones, which have no enquiry
   * to carry an assignment. Only honoured by the grouped list.
   */
  assignedUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// KPI tiles above the Quotations list. `revenue` is the total value of APPROVED quotations —
// the pipeline value actually won, not the sum of every draft ever raised.
export interface QuotationStatsResult {
  draft: number;
  sent: number;
  approved: number;
  rejected: number;
  revenue: string;
}

// Normalized recipient (the customer a quotation is addressed to), resolved from whichever source
// the quotation originated from. Used by both the API response and the PDF renderer.
export interface CustomerSnapshot {
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  gst: string | null;
}
