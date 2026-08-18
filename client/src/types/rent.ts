// Rent module — mirrors the server's rent-* modules ("md files/Stock/stock.md").
//
// Every money and quantity field is a plain number here: unlike the older modules, the rent
// services shape their responses explicitly and convert Prisma's Decimals before sending, so the
// client never has to decide whether a total arrived as a string.

import type { PaginationMeta } from './api';

export type RentalPersonStatus = 'ACTIVE' | 'INACTIVE';
export type RentalItemStatus = 'ACTIVE' | 'INACTIVE';
export type StockOutStatus = 'ACTIVE' | 'CANCELLED';
export type StockReturnStatus = 'NOT_RETURNED' | 'PARTIAL_RETURNED' | 'RETURNED';
export type RentPaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type RentPaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';

export const RENT_PAYMENT_MODES: { value: RentPaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
];

export interface UserMini {
  id: number;
  fullName: string;
}

// ---------------------------------------------------------------------------
// Rental person
// ---------------------------------------------------------------------------

export interface RentalPerson {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  status: RentalPersonStatus;
  createdAt: string;
  updatedAt: string;
  /** Rent standing, aggregated server-side (stock.md §24). */
  stockOutCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface CreateRentalPersonInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export interface UpdateRentalPersonInput extends Partial<CreateRentalPersonInput> {
  status?: RentalPersonStatus;
}

export interface ListRentalPersonsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: RentalPersonStatus;
  city?: string;
}

// ---------------------------------------------------------------------------
// Rental item master
// ---------------------------------------------------------------------------

export interface RentalItem {
  id: number;
  itemName: string;
  category: string | null;
  defaultRentRate: string | null;
  description: string | null;
  status: RentalItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRentalItemInput {
  itemName: string;
  category?: string;
  defaultRentRate?: number;
  description?: string;
}

export interface UpdateRentalItemInput extends Partial<CreateRentalItemInput> {
  status?: RentalItemStatus;
}

export interface ListRentalItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: RentalItemStatus;
  category?: string;
}

// ---------------------------------------------------------------------------
// Stock out
// ---------------------------------------------------------------------------

export interface StockOutPersonMini {
  id: number;
  name: string;
  phone: string;
  city: string | null;
  status: RentalPersonStatus;
}

export interface StockOutItem {
  id: number;
  rentalItemId: number | null;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  returnedQuantity: number;
  balanceQuantity: number;
  sortOrder: number;
}

export interface StockOutSummary {
  id: number;
  rentNo: string;
  stockOutDate: string;
  expectedReturnDate: string | null;
  rentalPerson: StockOutPersonMini;
  subtotal: number;
  /** Percentage agreed; `discount` is the money it works out to (stock.md §8). */
  discountPercent: number;
  discount: number;
  additionalCharges: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  issuedQuantity: number;
  returnedQuantity: number;
  pendingQuantity: number;
  returnStatus: StockReturnStatus;
  paymentStatus: RentPaymentStatus;
  status: StockOutStatus;
  notes: string | null;
  totalItems: number;
  returnCount: number;
  createdBy: UserMini | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockOutReturnEntry {
  id: number;
  returnNo: string;
  returnDate: string;
  notes: string | null;
  totalReturned: number;
  createdBy: UserMini | null;
  createdAt: string;
  items: {
    id: number;
    stockOutItemId: number;
    itemName: string;
    quantityReturned: number;
  }[];
}

export interface StockOutPaymentEntry {
  id: number;
  paymentNo: string;
  paymentDate: string;
  amount: number;
  paymentMode: RentPaymentMode;
  referenceNo: string | null;
  notes: string | null;
  receivedBy: UserMini | null;
}

export interface StockOutDetail extends StockOutSummary {
  items: StockOutItem[];
  returns: StockOutReturnEntry[];
  payments: StockOutPaymentEntry[];
}

export interface StockOutItemInput {
  rentalItemId?: number;
  itemName: string;
  quantity: number;
  rate: number;
  sortOrder?: number;
}

/** Money taken inline with another action — the advance on a stock out, the collection on a return. */
export interface InlinePaymentInput {
  amount: number;
  paymentMode: RentPaymentMode;
  paymentDate?: string;
  referenceNo?: string;
  notes?: string;
}

export interface CreateStockOutInput {
  rentalPersonId: number;
  stockOutDate?: string;
  expectedReturnDate?: string;
  discountPercent?: number;
  additionalCharges?: number;
  notes?: string;
  items: StockOutItemInput[];
  /** Advance taken as the stock goes out; saved in the same transaction as the stock out. */
  initialPayment?: InlinePaymentInput;
}

export interface UpdateStockOutInput {
  stockOutDate?: string;
  expectedReturnDate?: string;
  discountPercent?: number;
  additionalCharges?: number;
  notes?: string;
  items?: StockOutItemInput[];
}

export interface ListStockOutsParams {
  page?: number;
  limit?: number;
  search?: string;
  rentalPersonId?: number;
  returnStatus?: StockReturnStatus;
  paymentStatus?: RentPaymentStatus;
  status?: StockOutStatus;
  dateFrom?: string;
  dateTo?: string;
}

// ---------------------------------------------------------------------------
// Stock return
// ---------------------------------------------------------------------------

export interface StockReturn {
  id: number;
  returnNo: string;
  returnDate: string;
  notes: string | null;
  totalReturned: number;
  createdAt: string;
  createdBy: UserMini | null;
  stockOut: {
    id: number;
    rentNo: string;
    stockOutDate: string;
    expectedReturnDate: string | null;
    issuedQuantity: number;
    returnedQuantity: number;
    balanceQuantity: number;
    returnStatus: StockReturnStatus;
    rentalPerson: { id: number; name: string; phone: string };
  };
  items: {
    id: number;
    stockOutItemId: number;
    itemName: string;
    issuedQuantity: number;
    quantityReturned: number;
  }[];
}

export interface CreateStockReturnInput {
  returnDate?: string;
  notes?: string;
  items: { stockOutItemId: number; quantityReturned: number }[];
  /** Money settled at handover; saved in the same transaction as the return. */
  collection?: InlinePaymentInput;
}

export interface ListStockReturnsParams {
  page?: number;
  limit?: number;
  search?: string;
  stockOutId?: number;
  rentalPersonId?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReturnSummary {
  totalStockOuts: number;
  notReturned: number;
  partialReturned: number;
  returned: number;
  totalIssuedQuantity: number;
  totalReturnedQuantity: number;
}

// ---------------------------------------------------------------------------
// Rent payment
// ---------------------------------------------------------------------------

export interface RentPayment {
  id: number;
  paymentNo: string;
  paymentDate: string;
  amount: number;
  paymentMode: RentPaymentMode;
  referenceNo: string | null;
  notes: string | null;
  createdAt: string;
  receivedBy: UserMini | null;
  rentalPerson: { id: number; name: string; phone: string };
  stockOut: {
    id: number;
    rentNo: string;
    stockOutDate: string;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    paymentStatus: RentPaymentStatus;
  };
}

export interface CreateRentPaymentInput {
  stockOutId: number;
  rentalPersonId: number;
  paymentDate?: string;
  amount: number;
  paymentMode: RentPaymentMode;
  referenceNo?: string;
  notes?: string;
}

export interface UpdateRentPaymentInput {
  paymentDate?: string;
  amount?: number;
  paymentMode?: RentPaymentMode;
  referenceNo?: string;
  notes?: string;
}

export interface ListRentPaymentsParams {
  page?: number;
  limit?: number;
  search?: string;
  stockOutId?: number;
  rentalPersonId?: number;
  paymentMode?: RentPaymentMode;
  dateFrom?: string;
  dateTo?: string;
}

export interface RentPaymentSummary {
  totalRentalAmount: number;
  totalReceived: number;
  totalPending: number;
  unpaidCount: number;
  partiallyPaidCount: number;
  paidCount: number;
}

// ---------------------------------------------------------------------------
// Dashboard + reports
// ---------------------------------------------------------------------------

export interface RentDashboard {
  returns: ReturnSummary & { totalPendingQuantity: number };
  payments: RentPaymentSummary;
  recentStockOuts: StockOutSummary[];
  pendingReturns: StockOutSummary[];
  pendingPayments: StockOutSummary[];
}

export interface ReportEnvelope<TRow, TTotals> {
  rows: TRow[];
  totals: TTotals;
  truncated: boolean;
  rowLimit: number;
}

export interface StockOutReportRow extends StockOutSummary {
  items: { itemName: string; quantity: number; rate: number; amount: number }[];
}

export interface ReturnReportRow {
  id: number;
  rentNo: string;
  stockOutDate: string;
  expectedReturnDate: string | null;
  personName: string;
  personPhone: string;
  issuedQuantity: number;
  returnedQuantity: number;
  pendingQuantity: number;
  returnStatus: StockReturnStatus;
}

export interface PendingReturnReportRow {
  stockOutId: number;
  rentNo: string;
  personName: string;
  personPhone: string;
  expectedReturnDate: string | null;
  itemName: string;
  issuedQuantity: number;
  returnedQuantity: number;
  balanceQuantity: number;
}

export interface PaymentReportRow {
  id: number;
  rentNo: string;
  stockOutDate: string;
  personName: string;
  personPhone: string;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: RentPaymentStatus;
}

export interface PersonSummaryReportRow {
  id: number;
  name: string;
  phone: string;
  city: string | null;
  status: RentalPersonStatus;
  stockOutCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  returnedCount: number;
  pendingReturnCount: number;
}

export type StockOutReport = ReportEnvelope<
  StockOutReportRow,
  { stockOuts: number; quantity: number; amount: number; paid: number; balance: number }
>;
export type ReturnReport = ReportEnvelope<
  ReturnReportRow,
  { stockOuts: number; issued: number; returned: number; pending: number }
>;
export type PendingReturnReport = ReportEnvelope<
  PendingReturnReportRow,
  { lines: number; issued: number; returned: number; balance: number }
>;
export type PaymentReport = ReportEnvelope<
  PaymentReportRow,
  { stockOuts: number; amount: number; paid: number; balance: number }
>;
export type PersonSummaryReport = ReportEnvelope<
  PersonSummaryReportRow,
  { persons: number; stockOuts: number; amount: number; paid: number; pending: number }
>;

export interface RentReportFilters {
  dateFrom?: string;
  dateTo?: string;
  rentalPersonId?: number;
  rentalItemId?: number;
  returnStatus?: StockReturnStatus;
  paymentMode?: RentPaymentMode;
  paymentStatus?: RentPaymentStatus;
  search?: string;
}

export interface PaginatedResult<T> {
  records: T[];
  meta: PaginationMeta;
}
