import { z } from 'zod';

// The two order fields the Edit Order dialog writes. Requirements, Remarks and Coordinator were
// dropped from that form; the API still accepts them, this is only what the UI sends.
//
// No "at least one field" rule: the dialog also changes status, through a separate endpoint, so a
// save with both of these untouched is legitimate. It skips the update call entirely when nothing
// was typed (see OrderOverviewTab's isDirty guard) rather than posting an empty body.
export const updateOrderSchema = z.object({
  eventDate: z.string().optional().or(z.literal('')),
  venue: z.string().optional().or(z.literal('')),
});

export type UpdateOrderFormValues = z.infer<typeof updateOrderSchema>;
