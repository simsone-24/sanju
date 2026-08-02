import { OrderStatus } from '@prisma/client';

// 02_BUSINESS_WORKFLOW.md §9 "Suggested Colors" — five colors for the ten OrderStatus values,
// so this is a many-to-one grouping (see STATUS_COLOR in service.ts), not a 1:1 mapping.
export type CalendarColor = 'GREEN' | 'BLUE' | 'ORANGE' | 'RED' | 'GREY';

export interface CalendarEvent {
  id: string;
  orderNumber: string;
  customerName: string;
  eventDate: Date;
  venue: string | null;
  status: OrderStatus;
  color: CalendarColor;
}
