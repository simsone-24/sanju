import type { OrderStatus } from './order';

export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface CustomerListItem {
  id: string;
  customerCode: string;
  customerName: string;
  mobile: string;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  status: CustomerStatus;
  createdAt: string;
  totalEvents: number;
  lastEvent: string | null;
  outstandingAmount: string;
}

export interface CustomerDetail extends CustomerListItem {
  address: string | null;
  remarks: string | null;
  updatedAt: string;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  eventDate: string;
  venue: string | null;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  status: OrderStatus;
  createdAt: string;
}

export interface CustomerPaymentSummary {
  id: string;
  paymentDate: string;
  paymentType: string;
  amount: string;
  paymentMethod: string;
  receiptNumber: string;
  order: { id: string; orderNumber: string };
}

export interface CustomerHistory {
  previousEvents: CustomerOrderSummary[];
  upcomingEvents: CustomerOrderSummary[];
  payments: CustomerPaymentSummary[];
}

export interface ListCustomersParams {
  page: number;
  limit: number;
  search?: string;
  city?: string;
}

export interface UpdateCustomerInput {
  customerName?: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  remarks?: string;
}
