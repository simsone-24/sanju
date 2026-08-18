import { AppointmentStatus, EnquiryStatus, EventTime } from '@prisma/client';
import { z } from 'zod';
import { idSchema } from '../../utils/parseId';

const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, 'Mobile number must be a valid 10-digit number.');

const newCustomerSchema = z.object({
  type: z.literal('NEW'),
  customerName: z.string().min(1, 'Customer name is required.'),
  mobile: mobileSchema,
  whatsapp: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
});

const existingCustomerSchema = z.object({
  type: z.literal('EXISTING'),
  customerId: idSchema('A valid customer is required.'),
});

const customerInputSchema = z.discriminatedUnion('type', [newCustomerSchema, existingCustomerSchema]);

export const createEnquirySchema = z.object({
  customer: customerInputSchema,
  eventTypeId: idSchema('A valid event type is required.'),
  eventName: z.string().min(1).optional(),
  eventDate: z.coerce.date({ required_error: 'Event date is required.' }),
  eventTime: z.nativeEnum(EventTime).optional(),
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
  // When the customer should next be contacted — the optional Follow-up step of the workflow.
  followUpDate: z.coerce.date().optional(),
  status: z.nativeEnum(EnquiryStatus).optional(),
});

export const updateEnquirySchema = z
  .object({
    eventTypeId: idSchema().optional(),
    eventName: z.string().min(1).optional(),
    eventDate: z.coerce.date().optional(),
    eventTime: z.nativeEnum(EventTime).optional(),
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
    // Nullable, unlike on create: clearing the date is how a user says the follow-up is no longer
    // owed, and an omitted field means "leave as it is".
    followUpDate: z.coerce.date().nullable().optional(),
    // Prospect (unconfirmed customer) fields — ignored server-side once a Customer is linked.
    customerName: z.string().min(1).optional(),
    mobile: mobileSchema.optional(),
    whatsapp: z.string().min(1).optional(),
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
