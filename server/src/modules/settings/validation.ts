import { z } from 'zod';

export const updateCompanySchema = z
  .object({
    companyName: z.string().min(1).optional(),
    contactPerson: z.string().min(1).optional(),
    mobile: z.string().min(1).optional(),
    email: z.string().email().optional(),
    address: z.string().min(1).optional(),
    gstNumber: z
      .string()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Enter a valid GSTIN.')
      .optional(),
    website: z.string().url('Enter a valid website URL.').optional(),
    bankName: z.string().min(1).optional(),
    bankAccountName: z.string().min(1).optional(),
    bankAccountNumber: z.string().min(1).optional(),
    bankBranch: z.string().min(1).optional(),
    bankIfsc: z.string().min(1).optional(),
    bankUpi: z.string().min(1).optional(),
    authorizedSignatory: z.string().min(1).optional(),
    footerMessage: z.string().min(1).optional(),
    termsAndConditions: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export type UpdateCompanySchema = z.infer<typeof updateCompanySchema>;
