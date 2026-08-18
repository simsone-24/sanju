import { EventTime, OrderStatus } from '@prisma/client';
import * as calendarRepository from './repository';
import { CalendarColor, CalendarEvent } from './types';

type CalendarOrder = {
  id: number;
  orderNumber: string;
  // Nullable on the model: an order raised from an enquiry that had no event date yet. The range
  // filter already excludes those rows, so a dated order is all that ever reaches toCalendarEvent.
  eventDate: Date | null;
  venue: string | null;
  status: OrderStatus;
  customer: { customerName: string };
  enquiry: { eventName: string | null; eventTime: EventTime | null; mahal: string | null; eventType: { eventName: string } };
};

type DatedCalendarOrder = CalendarOrder & { eventDate: Date };

const STATUS_COLOR: Record<OrderStatus, CalendarColor> = {
  YET_TO_START: 'BLUE',
  IN_PROGRESS: 'ORANGE',
  ORDER_CLOSED: 'GREEN',
  REJECTED: 'GREY',
};

function toCalendarEvent(order: DatedCalendarOrder): CalendarEvent {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.customerName,
    eventName: order.enquiry.eventName || order.enquiry.eventType.eventName,
    eventType: order.enquiry.eventType.eventName,
    eventDate: order.eventDate,
    eventTime: order.enquiry.eventTime,
    mahal: order.enquiry.mahal,
    venue: order.venue,
    status: order.status,
    color: STATUS_COLOR[order.status],
  };
}

function toCalendarEvents(orders: CalendarOrder[]): CalendarEvent[] {
  return orders.filter((order): order is DatedCalendarOrder => order.eventDate !== null).map(toCalendarEvent);
}

function getWeekRange(date: Date): { startDate: Date; endDate: Date } {
  const day = date.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diffToMonday));
  const sunday = new Date(
    Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6, 23, 59, 59, 999),
  );
  return { startDate: monday, endDate: sunday };
}

export async function getMonth(companyId: number, month: number, year: number): Promise<CalendarEvent[]> {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // day 0 of next month = last day of this month
  const orders = await calendarRepository.findOrdersInRange(companyId, startDate, endDate);
  return toCalendarEvents(orders);
}

export async function getWeek(companyId: number, date: Date): Promise<CalendarEvent[]> {
  const { startDate, endDate } = getWeekRange(date);
  const orders = await calendarRepository.findOrdersInRange(companyId, startDate, endDate);
  return toCalendarEvents(orders);
}

export async function getDay(companyId: number, date: Date): Promise<CalendarEvent[]> {
  const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const endDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
  const orders = await calendarRepository.findOrdersInRange(companyId, startDate, endDate);
  return toCalendarEvents(orders);
}
