import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

export const convertToOrderSchema = z.object({
  enquiryId: z.string().uuid('A valid enquiry is required.'),
  quotationId: z.string().uuid('A valid quotation is required.'),
});

export const updateOrderSchema = z
  .object({
    eventDate: z.coerce.date().optional(),
    venue: z.string().min(1).optional(),
    notes: z.string().min(1).optional(),
    remarks: z.string().min(1).optional(),
    coordinatorId: z.string().uuid().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required.' });

export const changeOrderStatusSchema = z
  .object({
    status: z.nativeEnum(OrderStatus),
    cancellationReason: z.string().min(1).optional(),
    remarks: z.string().min(1).optional(),
  })
  .refine((data) => data.status !== OrderStatus.REJECTED || !!data.cancellationReason, {
    message: 'A reason is required when rejecting an order.',
    path: ['cancellationReason'],
  });

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  customerId: z.string().uuid().optional(),
  eventDateFrom: z.coerce.date().optional(),
  eventDateTo: z.coerce.date().optional(),
});

export type ConvertToOrderSchema = z.infer<typeof convertToOrderSchema>;
export type UpdateOrderSchema = z.infer<typeof updateOrderSchema>;
export type ChangeOrderStatusSchema = z.infer<typeof changeOrderStatusSchema>;
export type ListOrdersQuerySchema = z.infer<typeof listOrdersQuerySchema>;
