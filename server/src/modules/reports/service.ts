import { OrderStatus } from '@prisma/client';
import * as customersService from '../customers/service';
import { buildPaginationMeta } from '../../utils/pagination';
import * as reportsRepository from './repository';
import {
  CustomerReportParams,
  EventReportParams,
  ExpenseReportParams,
  OrderReportParams,
  OutstandingReportParams,
  RevenueReportParams,
} from './types';

export async function getRevenueReport(params: RevenueReportParams) {
  const {
    records,
    totalRecords,
    paymentCount,
    totalRevenue,
    expectedAmount,
    collectedAmount,
    pendingAmount,
    orderCount,
    collectedOrderCount,
    pendingOrderCount,
    collectedByStatus,
    pendingByStatus,
    monthly,
    methodBreakdown,
  } = await reportsRepository.listOrdersForRevenue(params);
  return {
    data: {
      summary: {
        // Payment-date based: money that came in during the window.
        totalRevenue,
        paymentCount,
        // Event-date based, and reconciling: expected = collected + pending for the events in the
        // window. Deliberately a different lens from totalRevenue above — see the repository.
        expectedAmount,
        collectedAmount,
        pendingAmount,
        orderCount,
        collectedOrderCount,
        pendingOrderCount,
        collectedByStatus,
        pendingByStatus,
        monthly,
        methodBreakdown,
      },
      // One row per order (event date in the window), like the Payment Tracker — not per payment.
      orders: records,
    },
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}

export async function getOutstandingReport(params: OutstandingReportParams) {
  const { records, totalRecords, orderCount, totalOutstanding, byStatus, monthly } =
    await reportsRepository.listOutstandingOrders(params);
  return {
    data: {
      // `orderCount` and `byStatus` describe the whole period; `totalRecords` (the table's own,
      // possibly status-narrowed, row count) only feeds the pagination meta below.
      summary: { totalOutstanding, orderCount, byStatus, monthly },
      orders: records,
    },
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}

// Reuses the Customers module's own list() wholesale — it already computes totalEvents/
// lastEvent/outstandingAmount per customer (see customers/service.ts), which is exactly what
// a Customer Report needs. No duplicated aggregation logic.
export async function getCustomerReport(params: CustomerReportParams) {
  const { records, meta } = await customersService.list(params);
  return { data: { customers: records }, meta };
}

export async function getEventReport(params: EventReportParams) {
  const { records, totalRecords, statusCounts } = await reportsRepository.listEventsReport(params);
  return {
    data: {
      summary: { totalEvents: totalRecords, statusCounts },
      events: records,
    },
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}

export async function getExpenseReport(params: ExpenseReportParams) {
  const summary = await reportsRepository.summarizeExpenses(params);
  return {
    totalAmount: Number(summary.totalAmount),
    expenseCount: summary.expenseCount,
    byCategory: summary.byCategory.map((entry) => ({ ...entry, amount: Number(entry.amount) })),
    byMethod: summary.byMethod.map((entry) => ({ ...entry, amount: Number(entry.amount) })),
    granularity: params.granularity,
    trend: summary.trend.map((point) => ({ ...point, amount: Number(point.amount) })),
  };
}

export async function getOrderReport(params: OrderReportParams) {
  const summary = await reportsRepository.summarizeOrders(params);
  // Value leaves rejected orders out — nothing is expected from them — while the count keeps them.
  const totalOrders = summary.byStatus.reduce((sum, entry) => sum + entry.orderCount, 0);
  const totalValue = summary.byStatus
    .filter((entry) => entry.status !== OrderStatus.REJECTED)
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  return {
    totalOrders,
    totalValue,
    granularity: params.granularity,
    byStatus: summary.byStatus.map((entry) => ({
      status: entry.status,
      orderCount: entry.orderCount,
      amount: entry.status === OrderStatus.REJECTED ? 0 : Number(entry.amount),
    })),
    byEventType: summary.byEventType.map((entry) => ({
      eventTypeId: entry.eventTypeId,
      eventTypeName: entry.eventTypeName ?? 'Not set',
      orderCount: entry.orderCount,
      amount: Number(entry.amount),
    })),
    trend: summary.trend.map((point) => ({ ...point, amount: Number(point.amount) })),
  };
}
