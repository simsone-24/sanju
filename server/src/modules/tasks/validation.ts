import { TaskCategory, TaskStatus } from '@prisma/client';
import { z } from 'zod';

export const createOrderTaskSchema = z.object({
  taskName: z.string().min(1, 'Task name is required.'),
  taskCategory: z.nativeEnum(TaskCategory),
  assignedToId: z.string().uuid().optional(),
  dueDate: z.coerce.date().optional(),
});

export const updateOrderTaskSchema = z
  .object({
    status: z.nativeEnum(TaskStatus).optional(),
    remarks: z.string().min(1).optional(),
    assignedToId: z.string().uuid().optional(),
    dueDate: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const listOrderTasksQuerySchema = z.object({
  taskCategory: z.nativeEnum(TaskCategory).optional(),
});

export type CreateOrderTaskSchema = z.infer<typeof createOrderTaskSchema>;
export type UpdateOrderTaskSchema = z.infer<typeof updateOrderTaskSchema>;
export type ListOrderTasksQuerySchema = z.infer<typeof listOrderTasksQuerySchema>;
