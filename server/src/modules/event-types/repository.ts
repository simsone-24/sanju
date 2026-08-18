import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ListEventTypesParams } from './types';

const eventTypeSelect = {
  id: true,
  eventName: true,
  colorCode: true,
  displayOrder: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EventTypeSelect;

export async function listEventTypes(params: ListEventTypesParams) {
  const where: Prisma.EventTypeWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.status ? { status: params.status } : {}),
    ...(params.search ? { eventName: { contains: params.search } } : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.eventType.findMany({
      where,
      select: eventTypeSelect,
      orderBy: [{ displayOrder: 'asc' }, { eventName: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.eventType.count({ where }),
  ]);

  return { records, totalRecords };
}

export function findEventTypeById(companyId: number, id: number) {
  return prisma.eventType.findFirst({ where: { id, companyId, deletedAt: null }, select: eventTypeSelect });
}

export function findEventTypeByName(companyId: number, eventName: string) {
  return prisma.eventType.findFirst({ where: { companyId, eventName, deletedAt: null } });
}

export function countEnquiriesForEventType(eventTypeId: number) {
  return prisma.enquiry.count({ where: { eventTypeId, deletedAt: null } });
}

export function createEventType(data: Prisma.EventTypeUncheckedCreateInput) {
  return prisma.eventType.create({ data, select: eventTypeSelect });
}

export function updateEventType(id: number, data: Prisma.EventTypeUpdateInput) {
  return prisma.eventType.update({ where: { id }, data, select: eventTypeSelect });
}

export function softDeleteEventType(id: number) {
  return prisma.eventType.update({ where: { id }, data: { deletedAt: new Date() } });
}
