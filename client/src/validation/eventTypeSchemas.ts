import { z } from 'zod';

export const eventTypeFormSchema = z.object({
  eventName: z.string().min(1, 'Event type name is required.'),
  colorCode: z.string().optional().or(z.literal('')),
  displayOrder: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 0), 'Must be a whole number, 0 or greater.'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type EventTypeFormValues = z.infer<typeof eventTypeFormSchema>;
