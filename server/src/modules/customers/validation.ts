import { z } from 'zod';

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
});

const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, 'Mobile number must be a valid 10-digit number.');

export const updateCustomerSchema = z
  .object({
    customerName: z.string().min(1).optional(),
    mobile: mobileSchema.optional(),
    whatsapp: z.string().min(1).optional(),
    email: z.string().email().optional(),
    address: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    remarks: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export type ListCustomersQuerySchema = z.infer<typeof listCustomersQuerySchema>;
export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>;
