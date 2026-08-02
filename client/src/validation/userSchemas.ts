import { z } from 'zod';

// Kept in step with the server's rules (server/src/modules/users/validation.ts) so the form catches
// what the API would reject; the API stays the real enforcement point.
const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(50, 'Username must be at most 50 characters.')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Use letters, numbers, dots, hyphens and underscores only.');

const mobile = z
  .string()
  .trim()
  .min(7, 'Enter a valid mobile number.')
  .max(20, 'Enter a valid mobile number.')
  .regex(/^[0-9+\s-]+$/, 'Use digits, spaces, + and - only.');

const optionalEmail = z.string().trim().email('Enter a valid email address.').optional().or(z.literal(''));
const optionalText = z.string().trim().max(191, 'This value is too long.').optional().or(z.literal(''));

export const createUserSchema = z
  .object({
    employeeCode: optionalText,
    fullName: z.string().trim().min(1, 'Full name is required.'),
    username,
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Confirm the password.'),
    mobile,
    email: optionalEmail,
    city: optionalText,
    userGroupId: z.string().min(1, 'User group is required.'),
    isActive: z.boolean(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    employeeCode: optionalText,
    fullName: z.string().trim().min(1, 'Full name is required.'),
    username,
    // Left blank means "keep the current password" — cleared before the request is sent.
    password: z.string().min(8, 'Password must be at least 8 characters.').optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    mobile,
    email: optionalEmail,
    city: optionalText,
    userGroupId: z.string().min(1, 'User group is required.'),
    isActive: z.boolean(),
  })
  .refine((values) => !values.password || values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
