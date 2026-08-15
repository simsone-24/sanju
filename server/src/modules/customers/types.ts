export interface ListCustomersParams {
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  city?: string;
}

export interface CreateCustomerInput {
  customerName: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  address?: string;
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
