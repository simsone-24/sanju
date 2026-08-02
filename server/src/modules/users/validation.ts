import { z } from 'zod';
import { permissionGrantsSchema } from '../user-groups/validation';

// Usernames are typed at every login, so they are kept to an unambiguous character set and stored
// lowercase — "Simsone" and "simsone" must not be two different accounts.
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters.')
  .max(50, 'Username must be at most 50 characters.')
  .regex(/^[a-z0-9._-]+$/, 'Username may only contain letters, numbers, dots, hyphens and underscores.');

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters.');
const mobileSchema = z
  .string()
  .trim()
  .min(7, 'Enter a valid mobile number.')
  .max(20, 'Enter a valid mobile number.')
  .regex(/^[0-9+\s-]+$/, 'Mobile number may only contain digits, spaces, + and -.');

// Optional text fields accept an empty string so a value can be cleared; the service stores null.
const optionalText = z.string().trim().max(191);
const optionalEmail = z.union([z.string().trim().email('Enter a valid email address.'), z.literal('')]);

export const createUserSchema = z
  .object({
    employeeCode: optionalText.optional(),
    fullName: z.string().trim().min(1, 'Full name is required.'),
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm the password.'),
    mobile: mobileSchema,
    email: optionalEmail.optional(),
    city: optionalText.optional(),
    userGroupId: z.string().uuid('A valid user group is required.'),
    isActive: z.boolean().optional(),
    permissionOverrides: permissionGrantsSchema.optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const updateUserSchema = z
  .object({
    employeeCode: optionalText.optional(),
    fullName: z.string().trim().min(1, 'Full name is required.').optional(),
    username: usernameSchema.optional(),
    // Left out entirely means "keep the current password".
    password: passwordSchema.optional(),
    confirmPassword: z.string().optional(),
    mobile: mobileSchema.optional(),
    email: optionalEmail.optional(),
    city: optionalText.optional(),
    userGroupId: z.string().uuid('A valid user group is required.').optional(),
    isActive: z.boolean().optional(),
    permissionOverrides: permissionGrantsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  userGroupId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type ListUsersQuerySchema = z.infer<typeof listUsersQuerySchema>;
