import { OrderStatus } from '@prisma/client';
import * as calendarRepository from './repository';
import { CalendarColor, CalendarEvent } from './types';

type CalendarOrder = {
  id: string;
  orderNumber: string;
  eventDate: Date;
  venue: string | null;
  status: OrderStatus;
  customer: { customerName: string };
};

// Grouped by narrative stage, since 5 documented colors must cover 10 statuses:
// not-yet-started (Blue/"Upcoming"), actively being prepared (Orange/"Planning"), balance
// still owed (Red — the one status whose name literally matches "Payment Pending"),
// finished (Green/"Completed"), dead (Grey/"Cancelled").
const STATUS_COLOR: Record<OrderStatus, CalendarColor> = {
  CONFIRMED: 'BLUE',
  ADVANCE_PENDING: 'BLUE',
  ADVANCE_RECEIVED: 'BLUE',
  PLANNING: 'ORANGE',
  READY: 'ORANGE',
  IN_PROGRESS: 'ORANGE',
  COMPLETED: 'GREEN',
  BALANCE_PENDING: 'RED',
  CLOSED: 'GREEN',
  CANCELLED: 'GREY',
};

function toCalendarEvent(order: CalendarOrder): CalendarEvent {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.customerName,
    eventDate: order.eventDate,
    venue: order.venue,
    status: order.status,
    color: STATUS_COLOR[order.status],
  };
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

export async function getMonth(companyId: string, month: number, year: number): Promise<CalendarEvent[]> {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // day 0 of next month = last day of this month
  const orders = await calendarRepository.findOrdersInRange(companyId, startDate, endDate);
  return orders.map(toCalendarEvent);
}

export async function getWeek(companyId: string, date: Date): Promise<CalendarEvent[]> {
  const { startDate, endDate } = getWeekRange(date);
  const orders = await calendarRepository.findOrdersInRange(companyId, startDate, endDate);
  return orders.map(toCalendarEvent);
}

export async function getDay(companyId: string, date: Date): Promise<CalendarEvent[]> {
  const startDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const endDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
  const orders = await calendarRepository.findOrdersInRange(companyId, startDate, endDate);
  return orders.map(toCalendarEvent);
}
