import { ExpenseCategoryStatus } from '@prisma/client';
import { z } from 'zod';

const nameSchema = z.string().trim().min(1, 'Category name is required.').max(100, 'Category name is too long.');

export const createExpenseCategorySchema = z.object({
  name: nameSchema,
});

export const updateExpenseCategorySchema = z
  .object({
    name: nameSchema.optional(),
    status: z.nativeEnum(ExpenseCategoryStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const listExpenseCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(ExpenseCategoryStatus).optional(),
});

export type CreateExpenseCategorySchema = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategorySchema = z.infer<typeof updateExpenseCategorySchema>;
export type ListExpenseCategoriesQuerySchema = z.infer<typeof listExpenseCategoriesQuerySchema>;
