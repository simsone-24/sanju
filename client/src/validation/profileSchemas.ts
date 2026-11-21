import { z } from 'zod';

// Kept in step with the server's rules (server/src/modules/auth/validation.ts); the API stays the
// real enforcement point.
export const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.'),
  mobile: z
    .string()
    .trim()
    .min(7, 'Enter a valid mobile number.')
    .max(20, 'Enter a valid mobile number.')
    .regex(/^[0-9+\s-]+$/, 'Use digits, spaces, + and - only.'),
  email: z.string().trim().email('Enter a valid email address.').or(z.literal('')),
  city: z.string().trim().max(191, 'This value is too long.'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Confirm the new password.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: 'The new password must be different from the current one.',
    path: ['newPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
