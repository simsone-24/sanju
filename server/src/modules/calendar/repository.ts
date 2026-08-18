import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

const calendarSelect = {
  id: true,
  orderNumber: true,
  eventDate: true,
  venue: true,
  status: true,
  customer: { select: { customerName: true } },
  enquiry: { select: { eventName: true, eventTime: true, mahal: true, eventType: { select: { eventName: true } } } },
} satisfies Prisma.OrderSelect;

// "Only active orders are displayed" (02_BUSINESS_WORKFLOW.md §13) is read here as "not
// soft-deleted" — deletedAt: null, same base filter used by every other module — since §9's
// own color legend includes Grey for Cancelled, implying cancelled orders still appear
// (greyed out) rather than being hidden outright.
export function findOrdersInRange(companyId: number, startDate: Date, endDate: Date) {
  return prisma.order.findMany({
    where: {
      companyId,
      deletedAt: null,
      eventDate: { gte: startDate, lte: endDate },
    },
    select: calendarSelect,
    orderBy: { eventDate: 'asc' },
  });
}
