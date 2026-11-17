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
    eventTypeId: z.string().optional().or(z.literal('')),
    eventName: z.string().optional().or(z.literal('')),
    // One row per day the event runs. A row with no date is simply ignored on a draft.
    eventDays: z.array(
      z.object({
        eventDate: z.string(),
        eventTime: z.enum(['MORNING', 'EVENING']).or(z.literal('')),
      }),
    ),
    mahal: z.string().optional().or(z.literal('')),
    venue: z.string().optional().or(z.literal('')),
    estimatedBudget: z.string().optional().or(z.literal('')),
    finalBudgetAmount: z.string().optional().or(z.literal('')),
    advanceAmount: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    appointmentDate: z.string().optional().or(z.literal('')),
    appointmentTime: z.string().optional().or(z.literal('')),
    meetingLocation: z.string().optional().or(z.literal('')),
    appointmentNotes: z.string().optional().or(z.literal('')),
    appointmentStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    assignedUserId: z.string().optional().or(z.literal('')),
    eventManagerId: z.string().optional().or(z.literal('')),
    // When the customer should next be contacted. Empty means no follow-up is owed.
    followUpDate: z.string().optional().or(z.literal('')),
    // Only meaningful on create — see EnquiryFormPage's EnquiryStatusSection. Any of the 6 statuses
    // may be chosen at creation; ORDER_CONFIRMED creates the customer record immediately server-side.
    status: z.enum([
      'DRAFT',
      'PENDING',
      'APPOINTMENT_FIXED',
      'QUOTATION_TO_SHARE',
      'QUOTATION_SHARED',
      'ORDER_CONFIRMED',
      'ORDER_LOST',
    ]),
  })
  .superRefine((data, ctx) => {
    // A Draft is saved mid-entry — none of the usual required fields apply until it moves to a
    // real status, mirroring server/src/modules/enquiries/validation.ts's own DRAFT bypass.
    if (data.status === 'DRAFT') return;

    if (!data.eventTypeId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['eventTypeId'], message: 'Select an event type.' });
    }
    const seen = new Set<string>();
    data.eventDays.forEach((day, index) => {
      if (!day.eventDate) {
        // The first row is the event's main date and is required; any further row left blank is a
        // mistake rather than an empty optional, so it is flagged too.
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['eventDays', index, 'eventDate'],
          message: index === 0 ? 'Event date is required.' : 'Pick a date or remove this row.',
        });
        return;
      }
      const key = `${day.eventDate}|${day.eventTime}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['eventDays', index, 'eventDate'],
          message: 'This date and time is already added.',
        });
      }
      seen.add(key);
    });

    if (data.customerType === 'EXISTING') {
      if (!data.customerId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customerId'], message: 'Select a customer.' });
      }
      return;
    }

    if (!data.customerName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customerName'], message: 'Customer name is required.' });
    }
    // Phone number is optional, but one that is given has to be a valid 10-digit number.
    if (data.mobile && !mobileRegex.test(data.mobile)) {
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
