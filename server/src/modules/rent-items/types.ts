import { RentalItemStatus } from '@prisma/client';

export interface CreateRentalItemInput {
  itemName: string;
  category?: string;
  defaultRentRate?: number;
  description?: string;
}

export interface UpdateRentalItemInput {
  itemName?: string;
  category?: string;
  defaultRentRate?: number;
  description?: string;
  status?: RentalItemStatus;
}

export interface ListRentalItemsParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  status?: RentalItemStatus;
  category?: string;
}
