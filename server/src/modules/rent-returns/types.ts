import { InlinePaymentInput } from '../rent-payments/inline';

export interface StockReturnItemInput {
  stockOutItemId: number;
  quantityReturned: number;
}

export interface CreateStockReturnInput {
  returnDate?: Date;
  notes?: string;
  items: StockReturnItemInput[];
  /** Optional money taken at handover; written in the same transaction as the return. */
  collection?: InlinePaymentInput;
}

export interface ListStockReturnsParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  stockOutId?: number;
  rentalPersonId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}
