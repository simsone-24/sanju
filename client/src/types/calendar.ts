import type { EventTime } from './enquiry';
import type { OrderStatus } from './order';

export type CalendarColor = 'GREEN' | 'BLUE' | 'ORANGE' | 'RED' | 'GREY';

export interface CalendarEvent {
  id: string;
  orderNumber: string;
  customerName: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  eventTime: EventTime | null;
  mahal: string | null;
  venue: string | null;
  status: OrderStatus;
  color: CalendarColor;
}
