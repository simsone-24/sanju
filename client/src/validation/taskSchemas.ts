import { z } from 'zod';

export const createTaskSchema = z.object({
  taskName: z.string().min(1, 'Task name is required.'),
  assignedToId: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
});

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

const TASK_STATUS_VALUES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] as const;

export const updateTaskSchema = z.object({
  status: z.enum(TASK_STATUS_VALUES),
  assignedToId: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  remarks: z.string().optional().or(z.literal('')),
});

export type UpdateTaskFormValues = z.infer<typeof updateTaskSchema>;
