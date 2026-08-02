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

  const [records, totalRecords, totalAggregate, methodBreakdown] = await Promise.all([
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
  ]);

  return {
    records,
    totalRecords,
    totalRevenue: totalAggregate._sum.amount ?? new Prisma.Decimal(0),
    methodBreakdown: methodBreakdown.map((entry) => ({
      paymentMethod: entry.paymentMethod,
      amount: entry._sum.amount ?? new Prisma.Decimal(0),
    })),
  };
}

export async function listOutstandingOrders(params: OutstandingReportParams) {
  const where: Prisma.OrderWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    status: { not: OrderStatus.CANCELLED },
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
