import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListOrdersParams, OrderStatsParams } from './types';

// Shared by listOrders and getOrderStats — every filter that isn't pagination, the dashboard
// cards' own status/date-window, or eventDate, so the two stay in lockstep by construction.
function buildOrderWhereBase(params: OrderStatsParams): Prisma.OrderWhereInput {
  return {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.customerId ? { customerId: params.customerId } : {}),
    ...(params.search
      ? {
          OR: [
            { orderNumber: { contains: params.search } },
            { customer: { customerName: { contains: params.search } } },
            { customer: { mobile: { contains: params.search } } },
          ],
        }
      : {}),
  };
}

function buildOrderWhere(params: OrderStatsParams): Prisma.OrderWhereInput {
  return {
    ...buildOrderWhereBase(params),
    ...(params.eventDateFrom || params.eventDateTo
      ? {
          eventDate: {
            ...(params.eventDateFrom ? { gte: params.eventDateFrom } : {}),
            ...(params.eventDateTo ? { lte: params.eventDateTo } : {}),
          },
        }
      : {}),
  };
}

const orderListSelect = {
  id: true,
  orderNumber: true,
  eventDate: true,
  venue: true,
  totalAmount: true,
  paidAmount: true,
  pendingAmount: true,
  status: true,
  createdAt: true,
  customer: { select: { id: true, customerName: true, mobile: true } },
  // The event's name/type/time live on the linked enquiry, not the order — surfaced here so the
  // Orders list can show an Event column ("md files/order/filter.md" §Orders Table).
  enquiry: { select: { eventName: true, eventTime: true, eventType: { select: { eventName: true } } } },
  // The Payment Tracker's own stored status, so the Orders module reports the same payment standing
  // the tracker does (Advance Paid / Partial Payment / Fully Paid) instead of a second vocabulary
  // derived from the amounts alone — which could not tell an advance apart from a part payment.
  paymentTracker: { select: { paymentStatus: true } },
} satisfies Prisma.OrderSelect;

const orderDetailSelect = {
  ...orderListSelect,
  notes: true,
  remarks: true,
  cancellationReason: true,
  updatedAt: true,
  // Widens (never narrows) orderListSelect's enquiry/customer so OrderDetail stays assignable to
  // OrderListItem. The extra fields feed the Order Details summary card and its Customer/Event
  // cards ("md files/order/view.md").
  enquiry: {
    select: {
      id: true,
      enquiryNumber: true,
      eventName: true,
      eventTime: true,
      eventType: { select: { eventName: true } },
    },
  },
  customer: {
    select: { id: true, customerName: true, mobile: true, email: true, address: true, createdAt: true },
  },
  quotation: {
    select: {
      id: true,
      quotationNumber: true,
      version: true,
      totalAmount: true,
      discount: true,
      pdfPath: true,
      status: true,
      quotationDate: true,
    },
  },
  coordinator: { select: { id: true, fullName: true } },
  payments: {
    where: { deletedAt: null },
    orderBy: { paymentDate: 'desc' },
    select: {
      id: true,
      paymentDate: true,
      paymentType: true,
      amount: true,
      paymentMethod: true,
      receiptNumber: true,
      referenceNumber: true,
    },
  },
  tasks: {
    orderBy: [{ taskCategory: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      taskName: true,
      taskCategory: true,
      status: true,
      dueDate: true,
      completedDate: true,
      assignedTo: { select: { id: true, fullName: true } },
      completedBy: { select: { id: true, fullName: true } },
    },
  },
  documents: {
    where: { deletedAt: null },
    orderBy: { uploadedAt: 'desc' },
    select: { id: true, documentType: true, fileName: true, filePath: true, uploadedAt: true },
  },
} satisfies Prisma.OrderSelect;

export async function listOrders(params: ListOrdersParams) {
  const where: Prisma.OrderWhereInput = {
    ...buildOrderWhere(params),
    ...(params.status ? { status: params.status } : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.order.findMany({
      where,
      select: orderListSelect,
      // Event-date order, soonest first — an event business works forward from the next event on
      // the calendar, not from whenever the paperwork happened to be raised. createdAt breaks ties
      // between orders sharing an event date.
      orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { records, totalRecords };
}

// eventDate is always stored at UTC midnight (z.coerce.date() on a plain "YYYY-MM-DD" — see
// orders/validation.ts), so these windows are built the same way for an exact match.
function startOfUTCDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUTCDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// Dashboard-card counts. The total and Order Closed narrow along with every other active list
// filter (search, customer, event date range), same as before. The four event-date windows are
// fixed, absolute ranges ("today" always means today) — built from buildOrderWhereBase so an
// active eventDate quick-filter never doubles up with, or hides, what these actually count.
export async function getOrderStats(params: OrderStatsParams) {
  const baseWhere = buildOrderWhere(params);
  const dateWindowWhere = buildOrderWhereBase(params);

  const today = startOfUTCDay(new Date());
  const tomorrow = addUTCDays(today, 1);
  // Sunday-start week, matching the client's quick-range pills (dayjs .startOf('week')).
  const weekStart = addUTCDays(today, -today.getUTCDay());
  const weekEnd = addUTCDays(weekStart, 6);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));

  const countEventWindow = (from: Date, to: Date) =>
    prisma.order.count({ where: { ...dateWindowWhere, eventDate: { gte: from, lte: to } } });

  const [total, todayEvents, tomorrowEvents, thisWeekEvents, thisMonthEvents, closed] = await Promise.all([
    prisma.order.count({ where: baseWhere }),
    countEventWindow(today, today),
    countEventWindow(tomorrow, tomorrow),
    countEventWindow(weekStart, weekEnd),
    countEventWindow(monthStart, monthEnd),
    prisma.order.count({ where: { ...baseWhere, status: OrderStatus.ORDER_CLOSED } }),
  ]);

  return { total, todayEvents, tomorrowEvents, thisWeekEvents, thisMonthEvents, closed };
}

export function findOrderById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.order.findFirst({ where: { id, companyId, deletedAt: null }, select: orderDetailSelect });
}

export function findOrderByEnquiryId(companyId: number, enquiryId: number, client: PrismaClientOrTx = prisma) {
  return client.order.findFirst({ where: { enquiryId, companyId, deletedAt: null } });
}

// The order raised from a given quotation, if one exists. Used when that quotation is edited after
// approval so the order's stored totals can follow it (quotations/service.ts `update`).
export function findOrderByQuotationId(companyId: number, quotationId: number, client: PrismaClientOrTx = prisma) {
  return client.order.findFirst({
    where: { quotationId, companyId, deletedAt: null },
    select: { id: true, orderNumber: true, status: true, paidAmount: true },
  });
}

// Enquiries ready to convert (docs/02_BUSINESS_WORKFLOW.md §6: ORDER_CONFIRMED + not yet converted).
// Approving a quotation is the only way an enquiry reaches ORDER_CONFIRMED (quotations/service.ts
// `approve`), so each of these has exactly one approved quotation.
export function listEligibleEnquiries(companyId: number) {
  return prisma.enquiry.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: 'ORDER_CONFIRMED',
      orders: { none: { deletedAt: null } },
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      enquiryNumber: true,
      eventDate: true,
      venue: true,
      customer: { select: { id: true, customerName: true, mobile: true } },
      quotations: {
        where: { deletedAt: null, status: 'APPROVED' },
        select: { id: true, quotationNumber: true, version: true, totalAmount: true },
      },
    },
  });
}

export function createOrder(data: Prisma.OrderUncheckedCreateInput, client: PrismaClientOrTx = prisma) {
  return client.order.create({ data, select: orderDetailSelect });
}

export function updateOrder(id: number, data: Prisma.OrderUncheckedUpdateInput, client: PrismaClientOrTx = prisma) {
  return client.order.update({ where: { id }, data, select: orderDetailSelect });
}

export async function seedOrderTasksFromTemplates(companyId: number, orderId: number, client: PrismaClientOrTx = prisma) {
  const templates = await client.taskTemplate.findMany({
    where: { companyId, deletedAt: null },
    orderBy: [{ taskCategory: 'asc' }, { displayOrder: 'asc' }],
  });

  if (templates.length === 0) return;

  await client.orderTask.createMany({
    data: templates.map((template) => ({
      orderId,
      taskName: template.taskName,
      taskCategory: template.taskCategory,
      status: 'PENDING' as const,
    })),
  });
}

export function getOrderActivityLog(id: number, client: PrismaClientOrTx = prisma) {
  return client.activityLog.findMany({
    where: { module: 'ORDERS', referenceId: id },
    orderBy: { performedAt: 'desc' },
    select: {
      id: true,
      action: true,
      description: true,
      // STATUS_CHANGE rows carry { from, to } — the Order Details progress tracker reads the stage
      // each entry moved the order into. Rows logged before that was recorded simply have none.
      metadata: true,
      performedAt: true,
      performedBy: { select: { id: true, fullName: true } },
    },
  });
}
