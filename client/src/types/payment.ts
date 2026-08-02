export type PaymentType = 'ADVANCE' | 'PARTIAL' | 'FINAL';
export type PaymentMethodType = 'CASH' | 'UPI' | 'BANK' | 'CARD' | 'CHEQUE';

export interface CreatePaymentInput {
  paymentDate?: string;
  paymentType: PaymentType;
  amount: number;
  paymentMethod: PaymentMethodType;
  referenceNumber?: string;
  remarks?: string;
}
