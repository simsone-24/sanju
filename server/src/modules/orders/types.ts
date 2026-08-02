import { OrderStatus } from '@prisma/client';

export interface ConvertToOrderInput {
  enquiryId: string;
  quotationId: string;
}

export interface UpdateOrderInput {
  eventDate?: Date;
  venue?: string;
  notes?: string;
  remarks?: string;
  coordinatorId?: string;
}

export interface ChangeOrderStatusInput {
  status: OrderStatus;
  cancellationReason?: string;
  remarks?: string;
}

// "md files/order/filter.md" groups the 10-status workflow into 4 dashboard buckets. Kept here
// (not in the UI) so the cards, their click-through filter, and the counts all read from one map.
export const ORDER_STATUS_GROUPS = {
  PLANNING: ['CONFIRMED', 'ADVANCE_PENDING', 'ADVANCE_RECEIVED', 'PLANNING', 'READY'],
  WORK_STARTED: ['IN_PROGRESS'],
  COMPLETED: ['COMPLETED', 'BALANCE_PENDING', 'CLOSED'],
  CANCELLED: ['CANCELLED'],
} as const satisfies Record<string, readonly OrderStatus[]>;

export type OrderStatusGroup = keyof typeof ORDER_STATUS_GROUPS;

export interface OrderStatsResult {
  total: number;
  planning: number;
  workStarted: number;
  completed: number;
  cancelled: number;
}

export interface ListOrdersParams {
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus;
  /** Dashboard-card filter — widens to every status in the group (see ORDER_STATUS_GROUPS). */
  statusGroup?: OrderStatusGroup;
  customerId?: string;
  eventDateFrom?: Date;
  eventDateTo?: Date;
}
