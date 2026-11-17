import { AppointmentStatus, EnquiryStatus, EventTime } from '@prisma/client';
import { z } from 'zod';
import { idSchema } from '../../utils/parseId';

const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, 'Mobile number must be a valid 10-digit number.');

// Lenient at the schema level — every field a real ("non-draft") enquiry requires is instead
// enforced in createEnquirySchema's superRefine below, gated on status !== DRAFT. A DRAFT enquiry
// can be saved with any of these blank or omitted entirely.
const newCustomerSchema = z.object({
  type: z.literal('NEW'),
  customerName: z.string().min(1).optional(),
  mobile: z.string().optional(),
  whatsapp: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
});

const existingCustomerSchema = z.object({
  type: z.literal('EXISTING'),
  customerId: idSchema().optional(),
});

const customerInputSchema = z.discriminatedUnion('type', [newCustomerSchema, existingCustomerSchema]);

// One day the event runs. The time is optional — a day can be booked before its slot is known.
const eventDaySchema = z.object({
  eventDate: z.coerce.date(),
  eventTime: z.nativeEnum(EventTime).nullable().optional(),
});

const eventDaysSchema = z.array(eventDaySchema).max(31, 'An event can have at most 31 days.');

export const createEnquirySchema = z
  .object({
    // Omitted entirely for a DRAFT saved before any customer type was picked.
    customer: customerInputSchema.optional(),
    eventTypeId: idSchema().optional(),
    eventName: z.string().min(1).optional(),
    eventDate: z.coerce.date().optional(),
    eventTime: z.nativeEnum(EventTime).optional(),
    // Every day the event runs, each with its own time of day. Supersedes eventDate / eventTime,
    // which are still accepted and treated as a single day when this is omitted.
    eventDays: eventDaysSchema.optional(),
    mahal: z.string().min(1).optional(),
    venue: z.string().min(1).optional(),
    estimatedBudget: z.coerce.number().min(0).optional(),
    // Settable at creation, not edit-only: the form shows the Final Budget section on a new enquiry
    // too, and an enquiry logged straight into Order Confirmed converts immediately — these are the
    // figures the resulting order's budget and opening advance are built from (orders/service.ts).
    finalBudgetAmount: z.coerce.number().min(0).optional(),
    advanceAmount: z.coerce.number().min(0).optional(),
    notes: z.string().min(1).optional(),
    appointmentDate: z.coerce.date().optional(),
    appointmentTime: z.string().min(1).optional(),
    meetingLocation: z.string().min(1).optional(),
    appointmentNotes: z.string().min(1).optional(),
    appointmentStatus: z.nativeEnum(AppointmentStatus).optional(),
    assignedUserId: idSchema().optional(),
    eventManagerId: idSchema().optional(),
    // When the customer should next be contacted — the optional Follow-up step of the workflow.
    followUpDate: z.coerce.date().optional(),
    status: z.nativeEnum(EnquiryStatus).optional(),
  })
  .superRefine((data, ctx) => {
    // A DRAFT enquiry is deliberately incomplete — it exists so a half-filled form can be saved and
    // finished later, so none of the fields a real enquiry needs are required here.
    if (data.status === EnquiryStatus.DRAFT) return;

    if (!data.eventTypeId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['eventTypeId'], message: 'A valid event type is required.' });
    }
    if (!data.eventDate && !data.eventDays?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['eventDays'], message: 'Event date is required.' });
    }
    if (!data.customer) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customer'], message: 'Customer details are required.' });
    } else if (data.customer.type === 'EXISTING') {
      if (!data.customer.customerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customer', 'customerId'],
          message: 'A valid customer is required.',
        });
      }
    } else {
      if (!data.customer.customerName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customer', 'customerName'],
          message: 'Customer name is required.',
        });
      }
      // Optional, but a number that is given has to be a valid one.
      if (data.customer.mobile && !mobileSchema.safeParse(data.customer.mobile).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customer', 'mobile'],
          message: 'Mobile number must be a valid 10-digit number.',
        });
      }
    }
  });

export const updateEnquirySchema = z
  .object({
    eventTypeId: idSchema().optional(),
    eventName: z.string().min(1).optional(),
    eventDate: z.coerce.date().optional(),
    eventTime: z.nativeEnum(EventTime).optional(),
    // Replaces the whole list of event days; an empty list removes them all.
    eventDays: eventDaysSchema.optional(),
    mahal: z.string().min(1).optional(),
    venue: z.string().min(1).optional(),
    estimatedBudget: z.coerce.number().min(0).optional(),
    finalBudgetAmount: z.coerce.number().min(0).optional(),
    advanceAmount: z.coerce.number().min(0).optional(),
    notes: z.string().min(1).optional(),
    appointmentDate: z.coerce.date().optional(),
    appointmentTime: z.string().min(1).optional(),
    meetingLocation: z.string().min(1).optional(),
    appointmentNotes: z.string().min(1).optional(),
    appointmentStatus: z.nativeEnum(AppointmentStatus).optional(),
    assignedUserId: idSchema().optional(),
    // Nullable, unlike on create: null removes the event manager, an omitted field leaves it alone.
    eventManagerId: idSchema().nullable().optional(),
    // Nullable, unlike on create: clearing the date is how a user says the follow-up is no longer
    // owed, and an omitted field means "leave as it is".
    followUpDate: z.coerce.date().nullable().optional(),
    // Prospect (unconfirmed customer) fields — ignored server-side once a Customer is linked.
    customerName: z.string().min(1).optional(),
    // null clears the number; an omitted field leaves it alone.
    mobile: mobileSchema.nullable().optional(),
    whatsapp: z.string().min(1).nullable().optional(),
    email: z.string().email().optional(),
    address: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const changeEnquiryStatusSchema = z.object({
  status: z.nativeEnum(EnquiryStatus),
  remarks: z.string().min(1).optional(),
});

export const createFollowUpSchema = z.object({
  followUpDate: z.coerce.date(),
  notes: z.string().min(1).optional(),
  outcome: z.string().min(1).optional(),
});

// Dashboard cards are single-select — the client only ever sends one value — but the param stays
// a (single-item) comma-separated list so the where-clause builder in repository.ts doesn't need
// two code paths.
const enquiryStatusGroupSchema = z.enum(['ACTIVE', 'CONFIRMED', 'PENDING', 'APPOINTMENT_PENDING']);

export const listEnquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(EnquiryStatus).optional(),
  appointmentStatus: z.nativeEnum(AppointmentStatus).optional(),
  statusGroup: z
    .string()
    .transform((value) => value.split(',').filter(Boolean))
    .pipe(z.array(enquiryStatusGroupSchema))
    .optional(),
  eventTypeId: idSchema().optional(),
  assignedUserId: idSchema().optional(),
  customerId: idSchema().optional(),
  eventDateFrom: z.coerce.date().optional(),
  eventDateTo: z.coerce.date().optional(),
  appointmentDateFrom: z.coerce.date().optional(),
  appointmentDateTo: z.coerce.date().optional(),
});

export type CreateEnquirySchema = z.infer<typeof createEnquirySchema>;
export type UpdateEnquirySchema = z.infer<typeof updateEnquirySchema>;
export type ChangeEnquiryStatusSchema = z.infer<typeof changeEnquiryStatusSchema>;
export type CreateFollowUpSchema = z.infer<typeof createFollowUpSchema>;
export type ListEnquiriesQuerySchema = z.infer<typeof listEnquiriesQuerySchema>;
