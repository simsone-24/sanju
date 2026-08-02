import { z } from 'zod';

export const updateOrderSchema = z
  .object({
    eventDate: z.string().optional().or(z.literal('')),
    venue: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    remarks: z.string().optional().or(z.literal('')),
    coordinatorId: z.string().optional().or(z.literal('')),
  })
  .refine((data) => Object.values(data).some((value) => value !== ''), {
    message: 'At least one field is required.',
  });

export type UpdateOrderFormValues = z.infer<typeof updateOrderSchema>;
