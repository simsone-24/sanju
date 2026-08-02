import { AppointmentStatus, EnquiryStatus } from '@prisma/client';
import { z } from 'zod';

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
  customerId: z.string().uuid('A valid customer is required.'),
});

const customerInputSchema = z.discriminatedUnion('type', [newCustomerSchema, existingCustomerSchema]);

export const createEnquirySchema = z.object({
  customer: customerInputSchema,
  eventTypeId: z.string().uuid('A valid event type is required.'),
  eventName: z.string().min(1).optional(),
  eventDate: z.coerce.date().optional(),
  mahal: z.string().min(1).optional(),
  venue: z.string().min(1).optional(),
  estimatedBudget: z.coerce.number().min(0).optional(),
  notes: z.string().min(1).optional(),
  appointmentDate: z.coerce.date().optional(),
  appointmentTime: z.string().min(1).optional(),
  meetingLocation: z.string().min(1).optional(),
  appointmentNotes: z.string().min(1).optional(),
  appointmentStatus: z.nativeEnum(AppointmentStatus).optional(),
  assignedUserId: z.string().uuid().optional(),
  status: z.nativeEnum(EnquiryStatus).optional(),
});

export const updateEnquirySchema = z
  .object({
    eventTypeId: z.string().uuid().optional(),
    eventName: z.string().min(1).optional(),
    eventDate: z.coerce.date().optional(),
    mahal: z.string().min(1).optional(),
    venue: z.string().min(1).optional(),
    estimatedBudget: z.coerce.number().min(0).optional(),
    finalBudgetAmount: z.coerce.number().min(0).optional(),
    notes: z.string().min(1).optional(),
    appointmentDate: z.coerce.date().optional(),
    appointmentTime: z.string().min(1).optional(),
    meetingLocation: z.string().min(1).optional(),
    appointmentNotes: z.string().min(1).optional(),
    appointmentStatus: z.nativeEnum(AppointmentStatus).optional(),
    assignedUserId: z.string().uuid().optional(),
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

export const listEnquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(EnquiryStatus).optional(),
  appointmentStatus: z.nativeEnum(AppointmentStatus).optional(),
  eventTypeId: z.string().uuid().optional(),
  assignedUserId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
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
