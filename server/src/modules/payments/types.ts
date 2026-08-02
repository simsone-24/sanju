import { PaymentMethod, PaymentType } from '@prisma/client';

export interface CreatePaymentInput {
  paymentDate?: Date;
  paymentType: PaymentType;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  remarks?: string;
}
