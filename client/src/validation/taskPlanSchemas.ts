import { z } from 'zod';

// Mirrors server/src/modules/task-plan/validation.ts so the same limits are enforced on both
// sides — the server stays the real enforcement point.
export const taskGroupSchema = z.object({
  title: z.string().trim().min(1, 'Task group title is required.').max(150, 'Title is too long.'),
  description: z.string().trim().max(1000, 'Description is too long.').optional().or(z.literal('')),
  // Tasks typed into the create form alongside the group. Blank rows are allowed here and
  // dropped on submit — an empty row the user never filled in is not a validation error.
  items: z.array(z.object({ taskName: z.string().trim().max(200, 'Task name is too long.') })),
});

export type TaskGroupFormValues = z.infer<typeof taskGroupSchema>;

const TASK_ITEM_STATUS_VALUES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;

export const taskItemSchema = z.object({
  taskName: z.string().trim().min(1, 'Task name is required.').max(200, 'Task name is too long.'),
  status: z.enum(TASK_ITEM_STATUS_VALUES),
  remarks: z.string().trim().max(1000, 'Remarks are too long.').optional().or(z.literal('')),
});

export type TaskItemFormValues = z.infer<typeof taskItemSchema>;
