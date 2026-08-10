import { z } from 'zod';

// Items are validated in the form (empty trailing rows are allowed so the table can auto-grow as the
// user types), so the schema itself keeps them permissive; the submit handler enforces the rules.
const quotationItemSchema = z.object({
  itemName: z.string(),
  quantity: z.string(),
  rate: z.string(),
});

// The three sources a user can raise a quotation from ("md files/Quotation/cr1.md" §Create
// Quotation). The API also accepts ORDER-sourced quotations, but those are raised from an order,
// not from this form.
export const QUOTATION_FORM_SOURCES = ['ENQUIRY', 'CUSTOMER', 'MANUAL'] as const;
export type QuotationFormSource = (typeof QUOTATION_FORM_SOURCES)[number];

// The statuses the form's Status field offers. REVISED is only available when editing: it means an
// edited version has superseded this one, which cannot be true of a document being created.
export const QUOTATION_CREATE_STATUSES = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED'] as const;
export const QUOTATION_EDIT_STATUSES = [...QUOTATION_CREATE_STATUSES, 'REVISED'] as const;

export const quotationFormSchema = z
  .object({
    source: z.enum(QUOTATION_FORM_SOURCES),
    status: z.enum(QUOTATION_EDIT_STATUSES),
    enquiryId: z.string().optional().or(z.literal('')),
    customerId: z.string().optional().or(z.literal('')),
    // MANUAL-source snapshot: a customer contacted by phone/WhatsApp for whom no Customer record
    // exists. WhatsApp is the one required field — it is how the quotation reaches them.
    manualName: z.string().optional().or(z.literal('')),
    manualPhone: z.string().optional().or(z.literal('')),
    manualWhatsapp: z.string().optional().or(z.literal('')),
    manualEmail: z.string().email('Enter a valid email.').optional().or(z.literal('')),
    manualAddress: z.string().optional().or(z.literal('')),
    manualGst: z.string().optional().or(z.literal('')),
    quotationDate: z.string().optional().or(z.literal('')),
    cgstPercent: z.string().optional().or(z.literal('')),
    sgstPercent: z.string().optional().or(z.literal('')),
    items: z.array(quotationItemSchema),
  })
  // Mirrors the API's own superRefine (server/src/modules/quotations/validation.ts): the required
  // link depends on the chosen source, so a mismatched combination is caught before submitting.
  .superRefine((data, ctx) => {
    if (data.source === 'ENQUIRY' && !data.enquiryId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['enquiryId'], message: 'Select an enquiry.' });
    }
    if (data.source === 'CUSTOMER' && !data.customerId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customerId'], message: 'Select a customer.' });
    }
    if (data.source === 'MANUAL') {
      if (!data.manualWhatsapp?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['manualWhatsapp'],
          message: 'WhatsApp number is required for a manual quotation.',
        });
      }
      if (!data.manualName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['manualName'], message: 'Customer name is required.' });
      }
    }
  });

export type QuotationFormValues = z.infer<typeof quotationFormSchema>;
