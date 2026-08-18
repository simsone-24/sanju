import { RentPaymentMode } from '@prisma/client';

export interface CreateRentPaymentInput {
  stockOutId: number;
  rentalPersonId: number;
  paymentDate?: Date;
  amount: number;
  paymentMode: RentPaymentMode;
  referenceNo?: string;
  notes?: string;
}

export interface UpdateRentPaymentInput {
  paymentDate?: Date;
  amount?: number;
  paymentMode?: RentPaymentMode;
  referenceNo?: string;
  notes?: string;
}

export interface ListRentPaymentsParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  stockOutId?: number;
  rentalPersonId?: number;
  paymentMode?: RentPaymentMode;
  dateFrom?: Date;
  dateTo?: Date;
}
