import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { ListCustomersParams } from './types';

const customerListSelect = {
  id: true,
  customerCode: true,
  customerName: true,
  mobile: true,
  whatsapp: true,
  email: true,
  city: true,
  status: true,
  createdAt: true,
} satisfies Prisma.CustomerSelect;

const customerDetailSelect = {
  ...customerListSelect,
  address: true,
  remarks: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

export async function listCustomers(params: ListCustomersParams) {
  const where: Prisma.CustomerWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.city ? { city: { equals: params.city } } : {}),
    ...(params.search
      ? {
          OR: [
            { customerCode: { contains: params.search } },
            { customerName: { contains: params.search } },
            { mobile: { contains: params.search } },
            { email: { contains: params.search } },
          ],
        }
      : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: customerListSelect,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return { records, totalRecords };
}

export async function getOrderStatsForCustomers(customerIds: string[], asOf: Date) {
  if (customerIds.length === 0) {
    return new Map<string, { totalEvents: number; lastEvent: Date | null; outstandingAmount: Prisma.Decimal }>();
  }

  const [totalEventsStats, lastEventStats, outstandingStats] = await Promise.all([
    prisma.order.groupBy({
      by: ['customerId'],
      where: { customerId: { in: customerIds }, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ['customerId'],
      where: {
        customerId: { in: customerIds },
        deletedAt: null,
        eventDate: { lte: asOf },
        status: { not: OrderStatus.CANCELLED },
      },
      _max: { eventDate: true },
    }),
    prisma.order.groupBy({
      by: ['customerId'],
      where: { customerId: { in: customerIds }, deletedAt: null, status: { not: OrderStatus.CANCELLED } },
      _sum: { pendingAmount: true },
    }),
  ]);

  const totalEventsMap = new Map(totalEventsStats.map((stat) => [stat.customerId, stat._count._all]));
  const lastEventMap = new Map(lastEventStats.map((stat) => [stat.customerId, stat._max.eventDate]));
  const outstandingMap = new Map(outstandingStats.map((stat) => [stat.customerId, stat._sum.pendingAmount]));

  const result = new Map<string, { totalEvents: number; lastEvent: Date | null; outstandingAmount: Prisma.Decimal }>();
  for (const id of customerIds) {
    result.set(id, {
      totalEvents: totalEventsMap.get(id) ?? 0,
      lastEvent: lastEventMap.get(id) ?? null,
      outstandingAmount: outstandingMap.get(id) ?? new Prisma.Decimal(0),
    });
  }
  return result;
}

export function findCustomerById(companyId: string, id: string, client: PrismaClientOrTx = prisma) {
  return client.customer.findFirst({
    where: { id, companyId, deletedAt: null },
    select: customerDetailSelect,
  });
}

export function findCustomerByMobile(companyId: string, mobile: string, client: PrismaClientOrTx = prisma) {
  return client.customer.findFirst({ where: { companyId, mobile, deletedAt: null } });
}

export function createCustomer(data: Prisma.CustomerUncheckedCreateInput, client: PrismaClientOrTx = prisma) {
  return client.customer.create({ data, select: customerDetailSelect });
}

export function getCustomerOrders(customerId: string) {
  return prisma.order.findMany({
    where: { customerId, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      eventDate: true,
      venue: true,
      totalAmount: true,
      paidAmount: true,
      pendingAmount: true,
      status: true,
      createdAt: true,
    },
    orderBy: { eventDate: 'desc' },
  });
}

export function getCustomerPayments(customerId: string) {
  return prisma.payment.findMany({
    where: { order: { customerId, deletedAt: null }, deletedAt: null },
    select: {
      id: true,
      paymentDate: true,
      paymentType: true,
      amount: true,
      paymentMethod: true,
      receiptNumber: true,
      order: { select: { id: true, orderNumber: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });
}
