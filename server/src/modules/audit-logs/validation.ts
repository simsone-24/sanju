import { z } from 'zod';
import { idSchema } from '../../utils/parseId';
import { DELETED_ITEM_TYPES } from './types';

// module / action are free text on the way in — the log's vocabulary grows as modules add their own —
// so they are only length-capped; a value that matches nothing simply returns no rows.
const keySchema = z.string().trim().min(1).max(50);

export const listAuditLogsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().optional(),
    search: z.string().trim().min(1).max(100).optional(),
    module: keySchema.optional(),
    action: keySchema.optional(),
    userId: idSchema().optional(),
    // Full timestamps, not bare dates: the browser sends the start and end of the chosen local day,
    // so "21 Nov" means the user's 21 Nov rather than a UTC day that is offset from it.
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  })
  .refine((query) => !query.dateFrom || !query.dateTo || query.dateFrom <= query.dateTo, {
    message: 'The start date must not be after the end date.',
    path: ['dateFrom'],
  });

export const listDeletedItemsQuerySchema = z.object({
  type: z.enum(DELETED_ITEM_TYPES),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).max(100).optional(),
});

// A deleted record is addressed by its kind and id, e.g. /deleted/ORDERS/42.
export const deletedItemParamsSchema = z.object({
  type: z.enum(DELETED_ITEM_TYPES),
  id: idSchema(),
});

export type ListAuditLogsQuerySchema = z.infer<typeof listAuditLogsQuerySchema>;
export type ListDeletedItemsQuerySchema = z.infer<typeof listDeletedItemsQuerySchema>;
