import { z } from 'zod';

// Form values are strings (that is what an <input> holds); the services convert to numbers before
// posting. Each rule below mirrors one the server enforces, so the user sees the failure before the
// round trip rather than instead of it.

const PHONE_PATTERN = /^[6-9]\d{9}$/;

export const rentalPersonFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  phone: z.string().trim().regex(PHONE_PATTERN, 'Enter a valid 10-digit phone number.'),
  email: z.string().trim().email('Enter a valid email address.').or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type RentalPersonFormValues = z.infer<typeof rentalPersonFormSchema>;

export const rentalItemFormSchema = z.object({
  itemName: z.string().trim().min(1, 'Item name is required.'),
  category: z.string().optional().or(z.literal('')),
  defaultRentRate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || Number(value) >= 0, 'Rate cannot be negative.'),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

export type RentalItemFormValues = z.infer<typeof rentalItemFormSchema>;

/**
 * The Add Payment form.
 *
 * The "cannot exceed the outstanding balance" rule (stock.md §22) is deliberately NOT here: the
 * balance changes when the user picks a different stock out in the same dialog, and a schema built
 * once at mount would keep validating against the first one's figure. It is checked in the dialog's
 * submit handler against the transaction actually selected, and again by the server, which is the
 * authority either way.
 */
export const rentPaymentFormSchema = z.object({
  stockOutId: z.string().min(1, 'Select a stock out.'),
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .refine((value) => Number(value) > 0, 'Amount must be greater than zero.'),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER']),
  paymentDate: z.string().optional().or(z.literal('')),
  referenceNo: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type RentPaymentFormValues = z.infer<typeof rentPaymentFormSchema>;
