import type { OrderStatus } from './order';

export type CalendarColor = 'GREEN' | 'BLUE' | 'ORANGE' | 'RED' | 'GREY';

export interface CalendarEvent {
  id: string;
  orderNumber: string;
  customerName: string;
  eventName: string;
  eventDate: string;
  venue: string | null;
  status: OrderStatus;
  color: CalendarColor;
}
