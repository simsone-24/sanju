import { OrderStatus } from '@prisma/client';

export interface ConvertToOrderInput {
  enquiryId: number;
  quotationId: number;
}

export interface UpdateOrderInput {
  eventDate?: Date;
  venue?: string;
  notes?: string;
  remarks?: string;
  coordinatorId?: number;
}

export interface ChangeOrderStatusInput {
  status: OrderStatus;
  cancellationReason?: string;
  remarks?: string;
}

// Orders list dashboard cards: an overall total, four fixed event-date windows (independent of
// whatever eventDate range the list is currently filtered to — "today" always means today), and
// the Order Closed lifecycle stage.
export interface OrderStatusCounts {
  yetToStart: number;
  inProgress: number;
  closed: number;
  rejected: number;
}

export interface OrderStatsResult {
  total: number;
  todayEvents: number;
  tomorrowEvents: number;
  thisWeekEvents: number;
  thisMonthEvents: number;
  closed: number;
  /** The same scopes as the counts above, each split by order status. */
  byStatus: {
    total: OrderStatusCounts;
    today: OrderStatusCounts;
    tomorrow: OrderStatusCounts;
    thisWeek: OrderStatusCounts;
    thisMonth: OrderStatusCounts;
  };
}

export interface ListOrdersParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus;
  customerId?: number;
  eventDateFrom?: Date;
  eventDateTo?: Date;
}

// The dashboard cards' own counts narrow along with every other active list filter — everything
// list accepts except pagination and status, since each card defines its own status.
export type OrderStatsParams = Omit<ListOrdersParams, 'page' | 'limit' | 'status'>;
