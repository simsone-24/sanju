import { z } from 'zod';

export const loginSchema = z.object({
  // Sign-in is by username, not email — masters/user.md §Login Credentials.
  username: z.string().trim().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
