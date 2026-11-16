import { RentalItemStatus } from '@prisma/client';
import { z } from 'zod';

// A whole number of units, never negative.
const totalStockSchema = z.coerce
  .number({ invalid_type_error: 'Total stock must be a number.' })
  .int('Total stock must be a whole number.')
  .min(0, 'Total stock cannot be negative.')
  .max(1_000_000_000, 'Total stock is too large.');

export const createRentalItemSchema = z.object({
  itemName: z.string().trim().min(1, 'Item name is required.'),
  category: z.string().trim().min(1).optional(),
  defaultRentRate: z.coerce.number().min(0, 'Rate cannot be negative.').optional(),
  totalStock: totalStockSchema.optional(),
  description: z.string().trim().min(1).optional(),
});

export const updateRentalItemSchema = z
  .object({
    itemName: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    defaultRentRate: z.coerce.number().min(0).optional(),
    totalStock: totalStockSchema.optional(),
    description: z.string().trim().min(1).optional(),
    status: z.nativeEnum(RentalItemStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const listRentalItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(RentalItemStatus).optional(),
  category: z.string().trim().min(1).optional(),
});

export type CreateRentalItemSchema = z.infer<typeof createRentalItemSchema>;
export type UpdateRentalItemSchema = z.infer<typeof updateRentalItemSchema>;
export type ListRentalItemsQuerySchema = z.infer<typeof listRentalItemsQuerySchema>;
