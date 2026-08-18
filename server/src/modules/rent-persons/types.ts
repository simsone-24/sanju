import { RentalPersonStatus } from '@prisma/client';

export interface CreateRentalPersonInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export interface UpdateRentalPersonInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  status?: RentalPersonStatus;
}

export interface ListRentalPersonsParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  status?: RentalPersonStatus;
  city?: string;
}
