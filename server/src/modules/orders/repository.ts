import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListOrdersParams, OrderStatsParams, OrderStatsResult, OrderStatusCounts } from './types';

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
      // Every day the event runs (the order's own eventDate is the earliest of them).
      eventDays: {
        where: { deletedAt: null },
        select: { eventDate: true, eventTime: true },
        orderBy: [{ eventDate: 'asc' }, { eventTime: 'asc' }, { id: 'asc' }],
      },
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

// Dashboard-card counts, each broken down by order status. The total scope narrows along with every
// other active list filter (search, customer, event date range). The four event-date windows are
// fixed, absolute ranges ("today" always means today) — built from buildOrderWhereBase so an
// active eventDate quick-filter never doubles up with, or hides, what these actually count.
async function countByStatus(where: Prisma.OrderWhereInput): Promise<OrderStatusCounts> {
  const rows = await prisma.order.groupBy({ by: ['status'], where, _count: { _all: true } });
  const countOf = (status: OrderStatus) => rows.find((row) => row.status === status)?._count._all ?? 0;
  return {
    yetToStart: countOf(OrderStatus.YET_TO_START),
    inProgress: countOf(OrderStatus.IN_PROGRESS),
    closed: countOf(OrderStatus.ORDER_CLOSED),
    rejected: countOf(OrderStatus.REJECTED),
  };
}

const sumOf = (counts: OrderStatusCounts) => counts.yetToStart + counts.inProgress + counts.closed + counts.rejected;

export async function getOrderStats(params: OrderStatsParams): Promise<OrderStatsResult> {
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
    countByStatus({ ...dateWindowWhere, eventDate: { gte: from, lte: to } });

  const [all, todayCounts, tomorrowCounts, weekCounts, monthCounts] = await Promise.all([
    countByStatus(baseWhere),
    countEventWindow(today, today),
    countEventWindow(tomorrow, tomorrow),
    countEventWindow(weekStart, weekEnd),
    countEventWindow(monthStart, monthEnd),
  ]);

  return {
    total: sumOf(all),
    todayEvents: sumOf(todayCounts),
    tomorrowEvents: sumOf(tomorrowCounts),
    thisWeekEvents: sumOf(weekCounts),
    thisMonthEvents: sumOf(monthCounts),
    closed: all.closed,
    byStatus: {
      total: all,
      today: todayCounts,
      tomorrow: tomorrowCounts,
      thisWeek: weekCounts,
      thisMonth: monthCounts,
    },
  };
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

// Batch form of findOrderByQuotationId: every live order raised from any of the given quotations.
export function findOrdersByQuotationIds(companyId: number, quotationIds: number[], client: PrismaClientOrTx = prisma) {
  return client.order.findMany({
    where: { quotationId: { in: quotationIds }, companyId, deletedAt: null },
    select: { quotationId: true, orderNumber: true },
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

/**
 * Soft-deletes one order together with everything that exists only because of it: its payments,
 * invoice, payment tracker, task plan (groups and items), documents, and any quotation raised later
 * from the order. The same chain the enquiry cascade takes (enquiries/repository.ts), scoped to this
 * order — the enquiry itself and the quotation the order was converted from are left alone, so the
 * enquiry simply becomes eligible for conversion again.
 *
 * One transaction, so an order can never end up deleted while live children still point at it. Only
 * models that carry a `deleted_at` column are stamped; order_tasks has none and is read exclusively
 * through the (now deleted) order, so it becomes unreachable rather than orphaned.
 *
 * Returns what was taken with the order, so the log line can say so — afterwards, "which payments did
 * this delete remove" is exactly what someone auditing it needs.
 */
export async function deleteOrderCascade(tx: PrismaClientOrTx, companyId: number, orderId: number) {
  const deletedAt = new Date();

  const payments = await tx.payment.findMany({
    where: { orderId, deletedAt: null },
    select: { amount: true },
  });

  const quotations = await tx.quotation.findMany({
    where: { orderId, companyId, deletedAt: null },
    select: { id: true },
  });
  const quotationIds = quotations.map((quotation) => quotation.id);

  const taskGroups = await tx.taskGroup.findMany({
    where: { orderId, deletedAt: null },
    select: { id: true },
  });
  const taskGroupIds = taskGroups.map((taskGroup) => taskGroup.id);

  if (quotationIds.length) {
    await tx.quotationImage.updateMany({
      where: { quotationId: { in: quotationIds }, deletedAt: null },
      data: { deletedAt },
    });
    await tx.quotation.updateMany({ where: { id: { in: quotationIds } }, data: { deletedAt } });
  }

  if (taskGroupIds.length) {
    await tx.taskItem.updateMany({
      where: { taskGroupId: { in: taskGroupIds }, deletedAt: null },
      data: { deletedAt },
    });
    await tx.taskGroup.updateMany({ where: { id: { in: taskGroupIds } }, data: { deletedAt } });
  }

  await tx.payment.updateMany({ where: { orderId, deletedAt: null }, data: { deletedAt } });
  await tx.invoice.updateMany({ where: { orderId, deletedAt: null }, data: { deletedAt } });
  await tx.paymentTracker.updateMany({ where: { orderId, deletedAt: null }, data: { deletedAt } });
  await tx.orderDocument.updateMany({ where: { orderId, deletedAt: null }, data: { deletedAt } });
  await tx.order.update({ where: { id: orderId }, data: { deletedAt } });

  return {
    paymentCount: payments.length,
    paymentTotal: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    quotationCount: quotationIds.length,
  };
}

/** The cascade in its own transaction — what the delete endpoint runs. */
export function softDeleteOrderCascade(companyId: number, orderId: number) {
  return prisma.$transaction((tx) => deleteOrderCascade(tx, companyId, orderId));
}

/** An order that has been soft-deleted, with the enquiry it came from — what a restore checks first. */
export function findDeletedOrderById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.order.findFirst({
    where: { id, companyId, deletedAt: { not: null } },
    select: {
      id: true,
      orderNumber: true,
      enquiryId: true,
      deletedAt: true,
      enquiry: { select: { id: true, enquiryNumber: true, deletedAt: true } },
    },
  });
}

/**
 * Brings back what a delete took with its orders — payments, invoice, payment tracker, documents, the
 * task plan (groups and items) and any quotation raised from the order — and nothing else.
 *
 * "What a delete took" is identified by timestamp: a cascade stamps every record it removes with the
 * same instant (deleteOrderCascade, enquiries' softDeleteEnquiryCascade), so a record carrying that
 * exact instant went with its parent, while one carrying a different instant was deleted on its own
 * earlier — a payment someone removed by hand — and stays deleted. The order's own amounts were never
 * touched by the cascade, so they are still right once its payments return.
 */
export async function restoreOrderDependants(tx: PrismaClientOrTx, orderIds: number[], stamp: Date) {
  if (orderIds.length === 0) return { paymentCount: 0, paymentTotal: 0, quotationCount: 0 };

  const payments = await tx.payment.findMany({
    where: { orderId: { in: orderIds }, deletedAt: stamp },
    select: { amount: true },
  });
  const quotations = await tx.quotation.findMany({
    where: { orderId: { in: orderIds }, deletedAt: stamp },
    select: { id: true },
  });
  const quotationIds = quotations.map((quotation) => quotation.id);
  const taskGroups = await tx.taskGroup.findMany({
    where: { orderId: { in: orderIds }, deletedAt: stamp },
    select: { id: true },
  });
  const taskGroupIds = taskGroups.map((taskGroup) => taskGroup.id);

  if (quotationIds.length) {
    await tx.quotationImage.updateMany({
      where: { quotationId: { in: quotationIds }, deletedAt: stamp },
      data: { deletedAt: null },
    });
    await tx.quotation.updateMany({ where: { id: { in: quotationIds } }, data: { deletedAt: null } });
  }
  if (taskGroupIds.length) {
    await tx.taskItem.updateMany({
      where: { taskGroupId: { in: taskGroupIds }, deletedAt: stamp },
      data: { deletedAt: null },
    });
    await tx.taskGroup.updateMany({ where: { id: { in: taskGroupIds } }, data: { deletedAt: null } });
  }

  await tx.payment.updateMany({ where: { orderId: { in: orderIds }, deletedAt: stamp }, data: { deletedAt: null } });
  await tx.invoice.updateMany({ where: { orderId: { in: orderIds }, deletedAt: stamp }, data: { deletedAt: null } });
  await tx.paymentTracker.updateMany({
    where: { orderId: { in: orderIds }, deletedAt: stamp },
    data: { deletedAt: null },
  });
  await tx.orderDocument.updateMany({
    where: { orderId: { in: orderIds }, deletedAt: stamp },
    data: { deletedAt: null },
  });

  return {
    paymentCount: payments.length,
    paymentTotal: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    quotationCount: quotationIds.length,
  };
}

/** The inverse of deleteOrderCascade, on the caller's transaction. */
export async function restoreOrderCascade(tx: PrismaClientOrTx, orderId: number, stamp: Date) {
  const restored = await restoreOrderDependants(tx, [orderId], stamp);
  await tx.order.update({ where: { id: orderId }, data: { deletedAt: null } });
  return restored;
}
