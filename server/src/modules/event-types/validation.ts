import { z } from 'zod';

export const createEventTypeSchema = z.object({
  eventName: z.string().min(1, 'Event type name is required.'),
  colorCode: z.string().min(1).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const updateEventTypeSchema = z
  .object({
    eventName: z.string().min(1).optional(),
    colorCode: z.string().min(1).optional(),
    displayOrder: z.number().int().min(0).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const listEventTypesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateEventTypeSchema = z.infer<typeof createEventTypeSchema>;
export type UpdateEventTypeSchema = z.infer<typeof updateEventTypeSchema>;
export type ListEventTypesQuerySchema = z.infer<typeof listEventTypesQuerySchema>;
