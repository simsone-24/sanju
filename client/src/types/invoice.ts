export interface InvoiceLineItem {
  itemName: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  rate: number;
  amount: number;
}

export interface InvoicePaymentLine {
  paymentDate: string;
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
  /** Relative upload path — resolve through getPublicAssetUrl before using as an <img> src. */
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

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  company: InvoiceCompany;
  order: {
    id: string;
    orderNumber: string;
    /** Null while the order's event date is still unknown — see OrderListItem.eventDate. */
    eventDate: string | null;
    venue: string | null;
    eventName: string;
  };
  customer: {
    customerName: string;
    mobile: string;
    email: string | null;
    address: string | null;
  };
  /** Null when the order was raised from an enquiry confirmed without any quotation. */
  quotationNumber: string | null;
  items: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  cgstPercent: number;
  sgstPercent: number;
  tax: number;
  /** Budget revised after the order was raised; printed only when non-zero. */
  adjustment: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  payments: InvoicePaymentLine[];
}
