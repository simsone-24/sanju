export interface InvoiceLineItem {
  itemName: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  rate: number;
  amount: number;
}

export interface InvoicePaymentLine {
  paymentDate: Date;
  paymentType: string;
  paymentMethod: string;
  receiptNumber: string;
  referenceNumber: string | null;
  amount: number;
}

export interface InvoiceCompany {
  companyName: string;
  address: string | null;
  gstNumber: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  /** Relative upload path — the client resolves it through getPublicAssetUrl. */
  logo: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankBranch: string | null;
  bankIfsc: string | null;
  bankUpi: string | null;
  authorizedSignatory: string | null;
  footerMessage: string | null;
  termsAndConditions: string | null;
}

export interface InvoiceResult {
  invoiceNumber: string;
  invoiceDate: Date;
  company: InvoiceCompany;
  order: {
    id: string;
    orderNumber: string;
    eventDate: Date;
    venue: string | null;
    eventName: string;
  };
  customer: {
    customerName: string;
    mobile: string;
    email: string | null;
    address: string | null;
  };
  quotationNumber: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  cgstPercent: number;
  sgstPercent: number;
  tax: number;
  /**
   * order.totalAmount − quotation.totalAmount. Non-zero only when the budget was revised in the
   * Payment Tracker after the order was raised; printed as its own line so the invoice's arithmetic
   * still reconciles instead of showing a total its own line items do not add up to.
   */
  adjustment: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  payments: InvoicePaymentLine[];
}
