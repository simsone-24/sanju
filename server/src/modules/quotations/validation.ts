import { QuotationSource, QuotationStatus } from '@prisma/client';
import { z } from 'zod';
import { idSchema } from '../../utils/parseId';

const quotationItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required.'),
  description: z.string().min(1).optional(),
  quantity: z.coerce.number().positive('Quantity must be greater than zero.'),
  unit: z.string().min(1).optional(),
  rate: z.coerce.number().min(0, 'Rate cannot be negative.'),
  sortOrder: z.number().int().min(0).optional(),
});

const manualCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  whatsapp: z.string().min(1, 'WhatsApp number is required for a manual quotation.'),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
  gst: z.string().min(1).optional(),
});

// The required link column depends on the source — enforced with superRefine so a mismatched
// payload (e.g. source=CUSTOMER with only an enquiryId) is rejected before it reaches the service.
export const createQuotationSchema = z
  .object({
    source: z.nativeEnum(QuotationSource),
    // The status the quotation is saved in, chosen on the form. REVISED is excluded: it means "an
    //edited version has superseded this one" and is set by create() when a new revision is raised,
    // so it can never describe a document at the moment it is written.
    status: z.enum(['DRAFT', 'SENT', 'APPROVED', 'REJECTED']).optional(),
    enquiryId: idSchema().optional(),
    customerId: idSchema().optional(),
    orderId: idSchema().optional(),
    manualCustomer: manualCustomerSchema.optional(),
    quotationDate: z.coerce.date().optional(),
    discount: z.coerce.number().min(0).optional(),
    cgstPercent: z.coerce.number().min(0).max(100).optional(),
    sgstPercent: z.coerce.number().min(0).max(100).optional(),
    remarks: z.string().min(1).optional(),
    items: z.array(quotationItemSchema).min(1, 'At least one line item is required.'),
  })
  .superRefine((data, ctx) => {
    if (data.source === QuotationSource.ENQUIRY && !data.enquiryId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['enquiryId'], message: 'Select an enquiry.' });
    }
    if (data.source === QuotationSource.CUSTOMER && !data.customerId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customerId'], message: 'Select a customer.' });
    }
    if (data.source === QuotationSource.ORDER && !data.orderId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['orderId'], message: 'Select an order.' });
    }
    if (data.source === QuotationSource.MANUAL && !data.manualCustomer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['manualCustomer'],
        message: 'Enter the customer WhatsApp number.',
      });
    }
  });

export const updateQuotationSchema = z
  .object({
    // Editing a saved quotation may also move its status; REVISED is offered here (unlike on
    // create) because an existing document can legitimately be marked superseded by hand.
    status: z.nativeEnum(QuotationStatus).optional(),
    quotationDate: z.coerce.date().optional(),
    discount: z.coerce.number().min(0).optional(),
    cgstPercent: z.coerce.number().min(0).max(100).optional(),
    sgstPercent: z.coerce.number().min(0).max(100).optional(),
    remarks: z.string().min(1).optional(),
    manualCustomer: manualCustomerSchema.optional(),
    items: z.array(quotationItemSchema).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const changeQuotationStatusSchema = z.object({
  status: z.enum(['SENT', 'REJECTED']),
  remarks: z.string().min(1).optional(),
});

export const listQuotationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  source: z.nativeEnum(QuotationSource).optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
  enquiryId: idSchema().optional(),
  customerId: idSchema().optional(),
  orderId: idSchema().optional(),
  assignedUserId: idSchema().optional(),
  // Filters on quotation_date (the document's own date), not created_at.
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type CreateQuotationSchema = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationSchema = z.infer<typeof updateQuotationSchema>;
export type ChangeQuotationStatusSchema = z.infer<typeof changeQuotationStatusSchema>;
export type ListQuotationsQuerySchema = z.infer<typeof listQuotationsQuerySchema>;
