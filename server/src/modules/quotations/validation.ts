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

const quotationSectionItemSchema = z.object({
  description: z.string().trim().min(1, 'Item description is required.').max(500),
  sizeQty: z.string().trim().max(100, 'Size / Qty is too long.').optional(),
});

const quotationSectionSchema = z.object({
  title: z.string().trim().max(150, 'Section heading is too long.').optional(),
  amount: z.coerce.number().min(0, 'Section amount cannot be negative.'),
  items: z.array(quotationSectionItemSchema).min(1, 'Add at least one item to each section.'),
});

const manualCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  // Both numbers are optional; without either, the quotation simply cannot be shared on WhatsApp.
  whatsapp: z.string().min(1).optional(),
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
    advanceAmount: z.coerce.number().min(0).optional(),
    remarks: z.string().min(1).optional(),
    // Either the flat priced items or section-wise lines.
    items: z.array(quotationItemSchema).optional(),
    sections: z.array(quotationSectionSchema).max(50, 'A quotation can have at most 50 sections.').optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.items?.length && !data.sections?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items'], message: 'At least one line item is required.' });
    }
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
        message: 'Enter the customer details.',
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
    advanceAmount: z.coerce.number().min(0).optional(),
    remarks: z.string().min(1).optional(),
    manualCustomer: manualCustomerSchema.optional(),
    items: z.array(quotationItemSchema).min(1).optional(),
    sections: z.array(quotationSectionSchema).min(1).max(50).optional(),
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

// Bulk delete from the list page. Capped at the list's largest page size, since a selection never
// spans pages.
export const bulkDeleteQuotationsSchema = z.object({
  ids: z
    .array(idSchema('Each selected quotation must be a valid id.'))
    .min(1, 'Select at least one quotation to delete.')
    .max(100, 'You can delete up to 100 quotations at a time.'),
});

export type CreateQuotationSchema = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationSchema = z.infer<typeof updateQuotationSchema>;
export type ChangeQuotationStatusSchema = z.infer<typeof changeQuotationStatusSchema>;
export type BulkDeleteQuotationsSchema = z.infer<typeof bulkDeleteQuotationsSchema>;
export type ListQuotationsQuerySchema = z.infer<typeof listQuotationsQuerySchema>;

// A short description of one sample image ("Stage", "Hall"…). Blank means no description.
const imageCaptionSchema = z.string().trim().max(100, 'Image description is too long.');

// The image upload is multipart: `captions` repeats once per file, in the same order as `images`
// (a single one arrives as a plain string rather than a list).
export const uploadQuotationImagesSchema = z.object({
  captions: z
    .preprocess((value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]), z.array(imageCaptionSchema))
    .optional(),
});

export const updateQuotationImageSchema = z.object({
  caption: imageCaptionSchema,
});

export type UploadQuotationImagesSchema = z.infer<typeof uploadQuotationImagesSchema>;
export type UpdateQuotationImageSchema = z.infer<typeof updateQuotationImageSchema>;
