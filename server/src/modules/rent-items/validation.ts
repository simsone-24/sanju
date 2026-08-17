import { RentalItemStatus } from '@prisma/client';
import { z } from 'zod';

export const createRentalItemSchema = z.object({
  itemName: z.string().trim().min(1, 'Item name is required.'),
  category: z.string().trim().min(1).optional(),
  defaultRentRate: z.coerce.number().min(0, 'Rate cannot be negative.').optional(),
  description: z.string().trim().min(1).optional(),
});

export const updateRentalItemSchema = z
  .object({
    itemName: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    defaultRentRate: z.coerce.number().min(0).optional(),
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
