import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  EventReportParams,
  ExpenseGranularity,
  ExpenseReportParams,
  OrderReportParams,
  OutstandingReportParams,
  RevenueReportParams,
} from './types';

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

interface ExpenseTrendRow {
  period: string;
  amount: Prisma.Decimal | null;
  expenseCount: bigint;
}

/**
 * Everything the Expenses report shows, aggregated in the database: the overall total, the split by
 * category and by payment method, and the per-month series. Only the category names (one lookup for
 * the handful of categories that appear) are fetched separately.
 */
export async function summarizeExpenses(params: ExpenseReportParams) {
  const where: Prisma.ExpenseWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.dateFrom || params.dateTo
      ? {
          expenseDate: {
            ...(params.dateFrom ? { gte: params.dateFrom } : {}),
            ...(params.dateTo ? { lte: params.dateTo } : {}),
          },
        }
      : {}),
  };

  const [total, byCategory, byMethod, trend] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.groupBy({ by: ['categoryId'], where, _sum: { amount: true }, _count: { _all: true } }),
    prisma.expense.groupBy({ by: ['paymentMethod'], where, _sum: { amount: true } }),
    listExpenseTrend(params),
  ]);

  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: byCategory.map((entry) => entry.categoryId) } },
    select: { id: true, name: true },
  });
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return {
    totalAmount: total._sum.amount ?? new Prisma.Decimal(0),
    expenseCount: total._count._all,
    byCategory: byCategory.map((entry) => ({
      categoryId: entry.categoryId,
      categoryName: categoryNames.get(entry.categoryId) ?? 'Unknown',
      amount: entry._sum.amount ?? new Prisma.Decimal(0),
      expenseCount: entry._count._all,
    })),
    byMethod: byMethod.map((entry) => ({
      paymentMethod: entry.paymentMethod,
      amount: entry._sum.amount ?? new Prisma.Decimal(0),
    })),
    trend,
  };
}

/**
 * The SQL that buckets a date column into a trend period. Only these three shapes exist — picked by
 * the whitelisted granularity, never built from request text. A week is identified by its Monday
 * (WEEKDAY() is 0 on Monday), matching the app's Monday-start weeks.
 */
function periodExpression(column: Prisma.Sql, granularity: ExpenseGranularity): Prisma.Sql {
  switch (granularity) {
    case 'day':
      return Prisma.sql`DATE_FORMAT(${column}, '%Y-%m-%d')`;
    case 'week':
      return Prisma.sql`DATE_FORMAT(DATE_SUB(${column}, INTERVAL WEEKDAY(${column}) DAY), '%Y-%m-%d')`;
    case 'month':
      return Prisma.sql`DATE_FORMAT(${column}, '%Y-%m')`;
  }
}

/** Expenses per day, week or calendar month, oldest first — raw SQL because Prisma's groupBy cannot bucket by date part. */
async function listExpenseTrend(params: ExpenseReportParams) {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`deleted_at IS NULL`,
    Prisma.sql`company_id = ${params.companyId}`,
  ];
  if (params.categoryId) conditions.push(Prisma.sql`category_id = ${params.categoryId}`);
  if (params.dateFrom) conditions.push(Prisma.sql`expense_date >= ${params.dateFrom}`);
  if (params.dateTo) conditions.push(Prisma.sql`expense_date <= ${params.dateTo}`);

  const rows = await prisma.$queryRaw<ExpenseTrendRow[]>`
    SELECT ${periodExpression(Prisma.sql`expense_date`, params.granularity)} AS period,
           SUM(amount) AS amount,
           COUNT(*) AS expenseCount
    FROM expenses
    WHERE ${Prisma.join(conditions, ' AND ')}
    GROUP BY period
    ORDER BY period ASC
  `;

  // COUNT() comes back as BigInt, which JSON.stringify refuses to serialise.
  return rows.map((row) => ({
    period: row.period,
    amount: row.amount ?? new Prisma.Decimal(0),
    expenseCount: Number(row.expenseCount),
  }));
}

interface OrderTrendRow {
  period: string;
  orderCount: bigint;
  amount: Prisma.Decimal | null;
}

interface OrderEventTypeRow {
  eventTypeId: number | null;
  eventTypeName: string | null;
  orderCount: bigint;
  amount: Prisma.Decimal | null;
}

// A rejected order is never going to be paid, so it counts as an order but adds no value.
const VALUE_EXCLUDING_REJECTED = Prisma.sql`SUM(CASE WHEN o.status <> 'REJECTED' THEN o.total_amount ELSE 0 END)`;

/** The window's end is inclusive of the whole last day, so the upper bound is the start of the next one. */
function endExclusive(dateTo: Date | undefined): Date | undefined {
  return dateTo ? new Date(dateTo.getTime() + 24 * 60 * 60 * 1000) : undefined;
}

function orderConditions(params: OrderReportParams): Prisma.Sql[] {
  const until = endExclusive(params.dateTo);
  const conditions: Prisma.Sql[] = [
    Prisma.sql`o.deleted_at IS NULL`,
    Prisma.sql`o.company_id = ${params.companyId}`,
  ];
  if (params.eventTypeId) conditions.push(Prisma.sql`e.event_type_id = ${params.eventTypeId}`);
  if (params.dateFrom) conditions.push(Prisma.sql`o.created_at >= ${params.dateFrom}`);
  if (until) conditions.push(Prisma.sql`o.created_at < ${until}`);
  return conditions;
}

/**
 * Everything the Orders report shows, aggregated in the database: how many orders and what they are
 * worth by status, by event type, and over time. Orders are placed in the date window by the day they
 * were raised.
 */
export async function summarizeOrders(params: OrderReportParams) {
  const until = endExclusive(params.dateTo);
  const where: Prisma.OrderWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.eventTypeId ? { enquiry: { eventTypeId: params.eventTypeId } } : {}),
    ...(params.dateFrom || until
      ? { createdAt: { ...(params.dateFrom ? { gte: params.dateFrom } : {}), ...(until ? { lt: until } : {}) } }
      : {}),
  };
  const conditions = Prisma.join(orderConditions(params), ' AND ');

  const [byStatus, byEventType, trend] = await Promise.all([
    prisma.order.groupBy({ by: ['status'], where, _count: { _all: true }, _sum: { totalAmount: true } }),
    prisma.$queryRaw<OrderEventTypeRow[]>`
      SELECT e.event_type_id AS eventTypeId,
             et.event_name AS eventTypeName,
             COUNT(*) AS orderCount,
             ${VALUE_EXCLUDING_REJECTED} AS amount
      FROM orders o
      JOIN enquiries e ON e.id = o.enquiry_id
      LEFT JOIN event_types et ON et.id = e.event_type_id
      WHERE ${conditions}
      GROUP BY e.event_type_id, et.event_name
    `,
    prisma.$queryRaw<OrderTrendRow[]>`
      SELECT ${periodExpression(Prisma.sql`o.created_at`, params.granularity)} AS period,
             COUNT(*) AS orderCount,
             ${VALUE_EXCLUDING_REJECTED} AS amount
      FROM orders o
      JOIN enquiries e ON e.id = o.enquiry_id
      WHERE ${conditions}
      GROUP BY period
      ORDER BY period ASC
    `,
  ]);

  return {
    byStatus: byStatus.map((entry) => ({
      status: entry.status,
      orderCount: entry._count._all,
      amount: entry._sum.totalAmount ?? new Prisma.Decimal(0),
    })),
    // COUNT() comes back as BigInt, which JSON.stringify refuses to serialise.
    byEventType: byEventType.map((row) => ({
      eventTypeId: row.eventTypeId,
      eventTypeName: row.eventTypeName,
      orderCount: Number(row.orderCount),
      amount: row.amount ?? new Prisma.Decimal(0),
    })),
    trend: trend.map((row) => ({
      period: row.period,
      orderCount: Number(row.orderCount),
      amount: row.amount ?? new Prisma.Decimal(0),
    })),
  };
}
