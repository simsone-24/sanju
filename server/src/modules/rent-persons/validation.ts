import { RentalPersonStatus } from '@prisma/client';
import { z } from 'zod';

// Same rule the Customer master applies to a mobile number — a rental person is contacted the same
// way, so one number format is validated across the app rather than two.
const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Phone number must be a valid 10-digit number.');

export const createRentalPersonSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  phone: phoneSchema,
  email: z.string().email().optional(),
  address: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
});

export const updateRentalPersonSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    phone: phoneSchema.optional(),
    email: z.string().email().optional(),
    address: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    notes: z.string().trim().min(1).optional(),
    status: z.nativeEnum(RentalPersonStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const listRentalPersonsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(RentalPersonStatus).optional(),
  city: z.string().trim().min(1).optional(),
});

export type CreateRentalPersonSchema = z.infer<typeof createRentalPersonSchema>;
export type UpdateRentalPersonSchema = z.infer<typeof updateRentalPersonSchema>;
export type ListRentalPersonsQuerySchema = z.infer<typeof listRentalPersonsQuerySchema>;
