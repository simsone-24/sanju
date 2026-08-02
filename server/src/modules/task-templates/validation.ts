import { TaskCategory } from '@prisma/client';
import { z } from 'zod';

export const createTaskTemplateSchema = z.object({
  taskName: z.string().min(1, 'Task name is required.'),
  taskCategory: z.nativeEnum(TaskCategory),
  displayOrder: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional(),
});

export const updateTaskTemplateSchema = z
  .object({
    taskName: z.string().min(1).optional(),
    taskCategory: z.nativeEnum(TaskCategory).optional(),
    displayOrder: z.number().int().min(0).optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const listTaskTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  taskCategory: z.nativeEnum(TaskCategory).optional(),
});

export type CreateTaskTemplateSchema = z.infer<typeof createTaskTemplateSchema>;
export type UpdateTaskTemplateSchema = z.infer<typeof updateTaskTemplateSchema>;
export type ListTaskTemplatesQuerySchema = z.infer<typeof listTaskTemplatesQuerySchema>;
