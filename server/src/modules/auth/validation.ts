import { z } from 'zod';
import { mobileSchema, optionalEmail, optionalText, passwordSchema } from '../users/validation';

export const loginSchema = z.object({
  // Lowercased to match how usernames are stored, so casing at the login prompt never matters.
  username: z.string().trim().toLowerCase().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

// Self-service profile: only the person's own contact details. Username, group, active flag and
// permissions stay administrator-only (Masters → Users).
export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name is required.').optional(),
    mobile: mobileSchema.optional(),
    email: optionalEmail.optional(),
    city: optionalText.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm the new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'The new password must be different from the current one.',
    path: ['newPassword'],
  });

export type LoginSchema = z.infer<typeof loginSchema>;
export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>;
