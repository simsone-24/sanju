import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { EventReportParams, OutstandingReportParams, RevenueReportParams } from './types';

export async function listPaymentsForRevenue(params: RevenueReportParams) {
  const where: Prisma.PaymentWhereInput = {
    deletedAt: null,
    order: {
      companyId: params.companyId,
      ...(params.eventTypeId ? { enquiry: { eventTypeId: params.eventTypeId } } : {}),
    },
    ...(params.dateFrom || params.dateTo
      ? {
          paymentDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
  };

  // The order-level position behind the report: what the events in this window are worth, what has
  // been collected on them and what is still owed. Scoped by event date (as the Outstanding and
  // Events reports scope theirs) rather than by payment date, so the three reconcile —
  // expected = collected + pending. Rejected orders are excluded: no money is expected from them.
  const orderWhere: Prisma.OrderWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    status: { not: OrderStatus.REJECTED },
    ...(params.eventTypeId ? { enquiry: { eventTypeId: params.eventTypeId } } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          eventDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
  };

  const [records, totalRecords, totalAggregate, methodBreakdown, orderAggregate, monthly] = await Promise.all([
    prisma.payment.findMany({
      where,
      select: {
        id: true,
        paymentDate: true,
        paymentType: true,
        amount: true,
        paymentMethod: true,
        receiptNumber: true,
        order: { select: { id: true, orderNumber: true, customer: { select: { customerName: true } } } },
      },
      orderBy: { paymentDate: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amount: true } }),
    prisma.payment.groupBy({ by: ['paymentMethod'], where, _sum: { amount: true } }),
    prisma.order.aggregate({
      where: orderWhere,
      _sum: { totalAmount: true, paidAmount: true, pendingAmount: true },
    }),
    listMonthlyRevenue(params),
  ]);

  return {
    records,
    totalRecords,
    totalRevenue: totalAggregate._sum.amount ?? new Prisma.Decimal(0),
    expectedAmount: orderAggregate._sum.totalAmount ?? new Prisma.Decimal(0),
    collectedAmount: orderAggregate._sum.paidAmount ?? new Prisma.Decimal(0),
    pendingAmount: orderAggregate._sum.pendingAmount ?? new Prisma.Decimal(0),
    monthly,
    methodBreakdown: methodBreakdown.map((entry) => ({
      paymentMethod: entry.paymentMethod,
      amount: entry._sum.amount ?? new Prisma.Decimal(0),
    })),
  };
}

interface MonthlyRevenueRow {
  month: string;
  amount: Prisma.Decimal | null;
  paymentCount: bigint;
}

/**
 * Revenue collected per calendar month, oldest first.
 *
 * Grouping by month is an expression over payment_date, which Prisma's groupBy cannot express, so
 * this is raw SQL — parameterised throughout, never interpolated. It aggregates in the database
 * rather than loading every matching payment to bucket them in Node, so an unfiltered report costs
 * one grouped scan instead of the whole payments table.
 */
async function listMonthlyRevenue(params: RevenueReportParams) {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`p.deleted_at IS NULL`,
    Prisma.sql`o.company_id = ${params.companyId}`,
  ];
  if (params.eventTypeId) conditions.push(Prisma.sql`e.event_type_id = ${params.eventTypeId}`);
  if (params.dateFrom) conditions.push(Prisma.sql`p.payment_date >= ${params.dateFrom}`);
  if (params.dateTo) conditions.push(Prisma.sql`p.payment_date <= ${params.dateTo}`);

  const rows = await prisma.$queryRaw<MonthlyRevenueRow[]>`
    SELECT DATE_FORMAT(p.payment_date, '%Y-%m') AS month,
           SUM(p.amount) AS amount,
           COUNT(*) AS paymentCount
    FROM payments p
    JOIN orders o ON o.id = p.order_id
    JOIN enquiries e ON e.id = o.enquiry_id
    WHERE ${Prisma.join(conditions, ' AND ')}
    GROUP BY month
    ORDER BY month ASC
  `;

  // COUNT() comes back as BigInt, which JSON.stringify refuses to serialise.
  return rows.map((row) => ({
    month: row.month,
    amount: row.amount ?? new Prisma.Decimal(0),
    paymentCount: Number(row.paymentCount),
  }));
}

export async function listOutstandingOrders(params: OutstandingReportParams) {
  const where: Prisma.OrderWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    status: { not: OrderStatus.REJECTED },
    pendingAmount: { gt: 0 },
    ...(params.customerId ? { customerId: params.customerId } : {}),
    ...(params.eventTypeId ? { enquiry: { eventTypeId: params.eventTypeId } } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          eventDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
  };

  const [records, totalRecords, aggregate] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        eventDate: true,
        totalAmount: true,
        paidAmount: true,
        pendingAmount: true,
        status: true,
        customer: { select: { id: true, customerName: true, mobile: true } },
      },
      orderBy: { eventDate: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { pendingAmount: true } }),
  ]);

  return { records, totalRecords, totalOutstanding: aggregate._sum.pendingAmount ?? new Prisma.Decimal(0) };
}

export async function listEventsReport(params: EventReportParams) {
  const where: Prisma.OrderWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.status ? { status: params.status } : {}),
    ...(params.eventTypeId ? { enquiry: { eventTypeId: params.eventTypeId } } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          eventDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
  };

  const [records, totalRecords, statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        eventDate: true,
        venue: true,
        status: true,
        totalAmount: true,
        customer: { select: { id: true, customerName: true } },
        enquiry: { select: { eventType: { select: { id: true, eventName: true, colorCode: true } } } },
      },
      orderBy: { eventDate: 'asc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ['status'], where, _count: { _all: true } }),
  ]);

  return {
    records,
    totalRecords,
    statusCounts: statusCounts.map((entry) => ({ status: entry.status, count: entry._count._all })),
  };
}
