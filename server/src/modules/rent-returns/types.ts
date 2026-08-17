import { InlinePaymentInput } from '../rent-payments/inline';

export interface StockReturnItemInput {
  stockOutItemId: string;
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
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  stockOutId?: string;
  rentalPersonId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
