import { RentPaymentMode, RentPaymentStatus, StockOutStatus, StockReturnStatus } from '@prisma/client';
import { InlinePaymentInput } from '../rent-payments/inline';

export interface StockOutItemInput {
  /** Null for a free-typed line whose item is not (yet) in the rental item master. */
  rentalItemId?: number;
  itemName: string;
  quantity: number;
  rate: number;
  sortOrder?: number;
}

export interface CreateStockOutInput {
  rentalPersonId: number;
  stockOutDate?: Date;
  expectedReturnDate?: Date;
  /** Percentage off the subtotal (0–100); the money amount is derived from it server-side. */
  discountPercent?: number;
  additionalCharges?: number;
  notes?: string;
  items: StockOutItemInput[];
  /** Optional advance taken as the stock goes out; written in the same transaction. */
  initialPayment?: InlinePaymentInput;
}

export interface UpdateStockOutInput {
  stockOutDate?: Date;
  expectedReturnDate?: Date;
  /** Percentage off the subtotal (0–100); the money amount is derived from it server-side. */
  discountPercent?: number;
  additionalCharges?: number;
  notes?: string;
  items?: StockOutItemInput[];
}

export interface StockOutFilters {
  companyId: number;
  search?: string;
  rentalPersonId?: number;
  returnStatus?: StockReturnStatus;
  paymentStatus?: RentPaymentStatus;
  /** Several statuses at once — the dashboard's "pending returns"/"pending payments" panels. */
  returnStatusIn?: StockReturnStatus[];
  paymentStatusIn?: RentPaymentStatus[];
  /** Restricts to stock outs carrying a line for this rental item (the report screens' Item filter). */
  rentalItemId?: number;
  /** Restricts to stock outs with at least one payment collected by this mode. */
  paymentMode?: RentPaymentMode;
  status?: StockOutStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ListStockOutsParams extends StockOutFilters {
  page: number;
  limit: number;
}
