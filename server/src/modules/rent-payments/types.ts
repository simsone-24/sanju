import { RentPaymentMode } from '@prisma/client';

export interface CreateRentPaymentInput {
  stockOutId: string;
  rentalPersonId: string;
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
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  stockOutId?: string;
  rentalPersonId?: string;
  paymentMode?: RentPaymentMode;
  dateFrom?: Date;
  dateTo?: Date;
}
