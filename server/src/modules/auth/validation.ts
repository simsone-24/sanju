import { z } from 'zod';

export const loginSchema = z.object({
  // Lowercased to match how usernames are stored, so casing at the login prompt never matters.
  username: z.string().trim().toLowerCase().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>;
