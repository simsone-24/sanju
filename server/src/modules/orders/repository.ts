import { Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListOrdersParams, ORDER_STATUS_GROUPS } from './types';

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
  // The event's name/type live on the linked enquiry, not the order — surfaced here so the Orders
  // list can show an Event column ("md files/order/filter.md" §Orders Table).
  enquiry: { select: { eventName: true, eventType: { select: { eventName: true } } } },
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
    select: { id: true, enquiryNumber: true, eventName: true, eventType: { select: { eventName: true } } },
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
    companyId: params.companyId,
    deletedAt: null,
    ...(params.status ? { status: params.status } : {}),
    ...(params.statusGroup && !params.status
      ? { status: { in: [...ORDER_STATUS_GROUPS[params.statusGroup]] } }
      : {}),
    ...(params.customerId ? { customerId: params.customerId } : {}),
    ...(params.eventDateFrom || params.eventDateTo
      ? {
          eventDate: {
            ...(params.eventDateFrom ? { gte: params.eventDateFrom } : {}),
            ...(params.eventDateTo ? { lte: params.eventDateTo } : {}),
          },
        }
      : {}),
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

// Dashboard-card counts, one per ORDER_STATUS_GROUPS bucket plus an overall total.
export async function getOrderStats(companyId: string) {
  const baseWhere: Prisma.OrderWhereInput = { companyId, deletedAt: null };
  const countIn = (group: keyof typeof ORDER_STATUS_GROUPS) =>
    prisma.order.count({ where: { ...baseWhere, status: { in: [...ORDER_STATUS_GROUPS[group]] } } });

  const [total, planning, workStarted, completed, cancelled] = await Promise.all([
    prisma.order.count({ where: baseWhere }),
    countIn('PLANNING'),
    countIn('WORK_STARTED'),
    countIn('COMPLETED'),
    countIn('CANCELLED'),
  ]);

  return { total, planning, workStarted, completed, cancelled };
}

export function findOrderById(companyId: string, id: string, client: PrismaClientOrTx = prisma) {
  return client.order.findFirst({ where: { id, companyId, deletedAt: null }, select: orderDetailSelect });
}

export function findOrderByEnquiryId(companyId: string, enquiryId: string, client: PrismaClientOrTx = prisma) {
  return client.order.findFirst({ where: { enquiryId, companyId, deletedAt: null } });
}

// The order raised from a given quotation, if one exists. Used when that quotation is edited after
// approval so the order's stored totals can follow it (quotations/service.ts `update`).
export function findOrderByQuotationId(companyId: string, quotationId: string, client: PrismaClientOrTx = prisma) {
  return client.order.findFirst({
    where: { quotationId, companyId, deletedAt: null },
    select: { id: true, orderNumber: true, status: true, paidAmount: true },
  });
}

// Enquiries ready to convert (docs/02_BUSINESS_WORKFLOW.md §6: ORDER_CONFIRMED + not yet converted).
// Approving a quotation is the only way an enquiry reaches ORDER_CONFIRMED (quotations/service.ts
// `approve`), so each of these has exactly one approved quotation.
export function listEligibleEnquiries(companyId: string) {
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

export function updateOrder(id: string, data: Prisma.OrderUncheckedUpdateInput, client: PrismaClientOrTx = prisma) {
  return client.order.update({ where: { id }, data, select: orderDetailSelect });
}

export async function seedOrderTasksFromTemplates(companyId: string, orderId: string, client: PrismaClientOrTx = prisma) {
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

export function getOrderActivityLog(id: string, client: PrismaClientOrTx = prisma) {
  return client.activityLog.findMany({
    where: { module: 'ORDERS', referenceId: id },
    orderBy: { performedAt: 'asc' },
    select: {
      id: true,
      action: true,
      description: true,
      performedAt: true,
      performedBy: { select: { id: true, fullName: true } },
    },
  });
}
