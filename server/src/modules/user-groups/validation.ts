import { z } from 'zod';
import { isCatalogPermission } from '../permissions/catalog';

// A permission is only accepted if the catalog actually defines it, so a request cannot store a
// grant the application will never check — see modules/permissions/catalog.ts.
export const permissionGrantSchema = z
  .object({
    module: z.string().min(1, 'Module is required.'),
    action: z.string().min(1, 'Action is required.'),
  })
  .refine((grant) => isCatalogPermission(grant.module, grant.action), {
    message: 'Unknown module or action.',
  });

export const permissionGrantsSchema = z.array(permissionGrantSchema);

const statusSchema = z.enum(['ACTIVE', 'INACTIVE']);
// Empty string is accepted so an existing description can be cleared; the service stores it as null.
const descriptionSchema = z.string().trim().max(1000, 'Description is too long.');

export const createUserGroupSchema = z.object({
  groupName: z.string().trim().min(1, 'Group name is required.'),
  description: descriptionSchema.optional(),
  status: statusSchema.optional(),
  permissions: permissionGrantsSchema.optional(),
});

export const updateUserGroupSchema = z
  .object({
    groupName: z.string().trim().min(1, 'Group name is required.').optional(),
    description: descriptionSchema.optional(),
    status: statusSchema.optional(),
    permissions: permissionGrantsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const listUserGroupsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  status: statusSchema.optional(),
});

export type CreateUserGroupSchema = z.infer<typeof createUserGroupSchema>;
export type UpdateUserGroupSchema = z.infer<typeof updateUserGroupSchema>;
export type ListUserGroupsQuerySchema = z.infer<typeof listUserGroupsQuerySchema>;
