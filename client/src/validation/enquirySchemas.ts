import { z } from 'zod';

// Flattened rather than a nested discriminated union — RHF's field-path typing doesn't play
// well with union-shaped nested objects. The customer.type discriminated union is reconstructed
// from these flat fields at submit time (see EnquiryFormPage's toCreateInput), matching
// server/src/modules/enquiries/validation.ts's actual shape exactly at the API boundary.
const mobileRegex = /^[6-9]\d{9}$/;

export const enquiryFormSchema = z
  .object({
    customerType: z.enum(['NEW', 'EXISTING']),
    customerId: z.string().optional().or(z.literal('')),
    customerName: z.string().optional().or(z.literal('')),
    mobile: z.string().optional().or(z.literal('')),
    whatsapp: z.string().optional().or(z.literal('')),
    email: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    eventTypeId: z.string().min(1, 'Select an event type.'),
    eventName: z.string().optional().or(z.literal('')),
    eventDate: z.string().optional().or(z.literal('')),
    mahal: z.string().optional().or(z.literal('')),
    venue: z.string().optional().or(z.literal('')),
    estimatedBudget: z.string().optional().or(z.literal('')),
    finalBudgetAmount: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    appointmentDate: z.string().optional().or(z.literal('')),
    appointmentTime: z.string().optional().or(z.literal('')),
    meetingLocation: z.string().optional().or(z.literal('')),
    appointmentNotes: z.string().optional().or(z.literal('')),
    appointmentStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    assignedUserId: z.string().optional().or(z.literal('')),
    // Only meaningful on create — see EnquiryFormPage's EnquiryStatusSection. Any of the 6 statuses
    // may be chosen at creation; ORDER_CONFIRMED creates the customer record immediately server-side.
    status: z.enum([
      'PENDING',
      'APPOINTMENT_FIXED',
      'QUOTATION_TO_SHARE',
      'QUOTATION_SHARED',
      'ORDER_CONFIRMED',
      'ORDER_LOST',
    ]),
  })
  .superRefine((data, ctx) => {
    if (data.customerType === 'EXISTING') {
      if (!data.customerId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customerId'], message: 'Select a customer.' });
      }
      return;
    }

    if (!data.customerName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customerName'], message: 'Customer name is required.' });
    }
    if (!data.mobile || !mobileRegex.test(data.mobile)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mobile'],
        message: 'Enter a valid 10-digit mobile number.',
      });
    }
    if (data.email && !z.string().email().safeParse(data.email).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Enter a valid email address.' });
    }
  });

export type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;
