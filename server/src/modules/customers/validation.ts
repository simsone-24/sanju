import { z } from 'zod';

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
});

export type ListCustomersQuerySchema = z.infer<typeof listCustomersQuerySchema>;
