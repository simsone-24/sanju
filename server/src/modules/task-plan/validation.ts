import { TaskGroupStatus, TaskItemStatus } from '@prisma/client';
import { z } from 'zod';

// scope.md §Add Task Group — the create form offers "+ Add Task" alongside the title and
// description, so a group and its first tasks arrive together and are written in one transaction.
// The form's two save actions differ only in `status`: "Save" publishes, "Save as Draft" does not.
export const createTaskGroupSchema = z.object({
  title: z.string().trim().min(1, 'Task group title is required.').max(150),
  description: z.string().trim().max(1000).optional(),
  status: z.nativeEnum(TaskGroupStatus).optional(),
  items: z
    .array(
      z.object({
        taskName: z.string().trim().min(1, 'Task name is required.').max(200),
        status: z.nativeEnum(TaskItemStatus).optional(),
        remarks: z.string().trim().max(1000).optional(),
      }),
    )
    .max(100, 'A task group cannot be created with more than 100 tasks at once.')
    .optional(),
});

export const updateTaskGroupSchema = z
  .object({
    title: z.string().trim().min(1, 'Task group title is required.').max(150).optional(),
    description: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

// Publishing a draft (or pulling a published group back) goes through its own endpoint rather than
// the general update, so the transition rules in the service are the only way the status can move.
export const changeTaskGroupStatusSchema = z.object({
  status: z.nativeEnum(TaskGroupStatus),
});

export const createTaskItemSchema = z.object({
  taskName: z.string().trim().min(1, 'Task name is required.').max(200),
  status: z.nativeEnum(TaskItemStatus).optional(),
  remarks: z.string().trim().max(1000).optional(),
});

export const updateTaskItemSchema = z
  .object({
    taskName: z.string().trim().min(1, 'Task name is required.').max(200).optional(),
    status: z.nativeEnum(TaskItemStatus).optional(),
    remarks: z.string().trim().max(1000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export type CreateTaskGroupSchema = z.infer<typeof createTaskGroupSchema>;
export type UpdateTaskGroupSchema = z.infer<typeof updateTaskGroupSchema>;
export type ChangeTaskGroupStatusSchema = z.infer<typeof changeTaskGroupStatusSchema>;
export type CreateTaskItemSchema = z.infer<typeof createTaskItemSchema>;
export type UpdateTaskItemSchema = z.infer<typeof updateTaskItemSchema>;
