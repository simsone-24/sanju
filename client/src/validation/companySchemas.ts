import { z } from 'zod';

export const updateCompanySchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  contactPerson: z.string().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  email: z.string().email('Enter a valid email.').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Enter a valid GSTIN.')
    .optional()
    .or(z.literal('')),
  website: z.string().url('Enter a valid website URL.').optional().or(z.literal('')),
  bankName: z.string().optional().or(z.literal('')),
  bankAccountName: z.string().optional().or(z.literal('')),
  bankAccountNumber: z.string().optional().or(z.literal('')),
  bankBranch: z.string().optional().or(z.literal('')),
  bankIfsc: z.string().optional().or(z.literal('')),
  bankUpi: z.string().optional().or(z.literal('')),
  authorizedSignatory: z.string().optional().or(z.literal('')),
  footerMessage: z.string().optional().or(z.literal('')),
  termsAndConditions: z.string().optional().or(z.literal('')),
});

export type UpdateCompanyFormValues = z.infer<typeof updateCompanySchema>;
