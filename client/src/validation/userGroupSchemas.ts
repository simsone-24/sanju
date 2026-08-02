import { z } from 'zod';

export const userGroupFormSchema = z.object({
  groupName: z.string().trim().min(1, 'Group name is required.'),
  description: z.string().trim().max(1000, 'Description is too long.').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type UserGroupFormValues = z.infer<typeof userGroupFormSchema>;
