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

// Orders list dashboard cards: an overall total, four fixed event-date windows (independent of
// whatever eventDate range the list is currently filtered to — "today" always means today), and
// the Order Closed lifecycle stage.
export interface OrderStatsResult {
  total: number;
  todayEvents: number;
  tomorrowEvents: number;
  thisWeekEvents: number;
  thisMonthEvents: number;
  closed: number;
}

export interface ListOrdersParams {
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  eventDateFrom?: Date;
  eventDateTo?: Date;
}

// The dashboard cards' own counts narrow along with every other active list filter — everything
// list accepts except pagination and status, since each card defines its own status.
export type OrderStatsParams = Omit<ListOrdersParams, 'page' | 'limit' | 'status'>;
