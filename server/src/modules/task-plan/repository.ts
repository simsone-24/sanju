import { Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';

const taskItemSelect = {
  id: true,
  taskName: true,
  status: true,
  remarks: true,
  photoPath: true,
  completedAt: true,
  displayOrder: true,
} satisfies Prisma.TaskItemSelect;

const taskGroupSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  displayOrder: true,
  items: {
    where: { deletedAt: null },
    select: taskItemSelect,
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.TaskGroupSelect;

export function listGroupsForOrder(companyId: string, orderId: string) {
  return prisma.taskGroup.findMany({
    where: { orderId, deletedAt: null, order: { companyId, deletedAt: null } },
    select: taskGroupSelect,
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export function findGroupById(companyId: string, id: string, client: PrismaClientOrTx = prisma) {
  return client.taskGroup.findFirst({
    where: { id, deletedAt: null, order: { companyId, deletedAt: null } },
    select: {
      ...taskGroupSelect,
      order: { select: { id: true, orderNumber: true } },
    },
  });
}

export function findItemById(companyId: string, id: string, client: PrismaClientOrTx = prisma) {
  return client.taskItem.findFirst({
    where: { id, deletedAt: null, taskGroup: { deletedAt: null, order: { companyId, deletedAt: null } } },
    select: {
      ...taskItemSelect,
      taskGroup: {
        select: { id: true, title: true, order: { select: { id: true, orderNumber: true } } },
      },
    },
  });
}

/** Next display order for a new group in an order — soft-deleted rows keep their slot. */
export async function nextGroupDisplayOrder(orderId: string): Promise<number> {
  const highest = await prisma.taskGroup.aggregate({ where: { orderId }, _max: { displayOrder: true } });
  return (highest._max.displayOrder ?? -1) + 1;
}

export async function nextItemDisplayOrder(taskGroupId: string): Promise<number> {
  const highest = await prisma.taskItem.aggregate({ where: { taskGroupId }, _max: { displayOrder: true } });
  return (highest._max.displayOrder ?? -1) + 1;
}

/** Creates the group and any tasks typed alongside it in a single statement, so a group is never
 * persisted without the tasks the user entered with it. */
export function createGroup(
  data: Prisma.TaskGroupUncheckedCreateInput,
  items: Prisma.TaskItemCreateWithoutTaskGroupInput[] = [],
  client: PrismaClientOrTx = prisma,
) {
  return client.taskGroup.create({
    data: { ...data, ...(items.length > 0 ? { items: { create: items } } : {}) },
    select: taskGroupSelect,
  });
}

export function updateGroup(
  id: string,
  data: Prisma.TaskGroupUncheckedUpdateInput,
  client: PrismaClientOrTx = prisma,
) {
  return client.taskGroup.update({ where: { id }, data, select: taskGroupSelect });
}

/**
 * Soft-deletes a group and every item inside it in one transaction — "Deleting a Task Group
 * deletes all its Task Items" (scope.md §Business Rules).
 */
export function softDeleteGroupWithItems(id: string): Promise<void> {
  return prisma.$transaction(async (tx) => {
    const deletedAt = new Date();
    await tx.taskItem.updateMany({ where: { taskGroupId: id, deletedAt: null }, data: { deletedAt } });
    await tx.taskGroup.update({ where: { id }, data: { deletedAt } });
  });
}

export function createItem(data: Prisma.TaskItemUncheckedCreateInput, client: PrismaClientOrTx = prisma) {
  return client.taskItem.create({ data, select: taskItemSelect });
}

export function updateItem(
  id: string,
  data: Prisma.TaskItemUncheckedUpdateInput,
  client: PrismaClientOrTx = prisma,
) {
  return client.taskItem.update({ where: { id }, data, select: taskItemSelect });
}

export function softDeleteItem(id: string, client: PrismaClientOrTx = prisma) {
  return client.taskItem.update({ where: { id }, data: { deletedAt: new Date() }, select: { id: true } });
}
