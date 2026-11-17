export interface ListCustomersParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  city?: string;
}

export interface CreateCustomerInput {
  customerName: string;
  mobile?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
}

export interface UpdateCustomerInput {
  customerName?: string;
  /** null clears the number. */
  mobile?: string | null;
  /** null clears the number. */
  whatsapp?: string | null;
  email?: string;
  address?: string;
  city?: string;
  remarks?: string;
}
