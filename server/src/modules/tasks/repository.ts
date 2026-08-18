import { Prisma, TaskCategory } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';

const taskSelect = {
  id: true,
  taskName: true,
  taskCategory: true,
  status: true,
  dueDate: true,
  completedDate: true,
  remarks: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: { select: { id: true, fullName: true } },
  completedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.OrderTaskSelect;

const taskDetailSelect = {
  ...taskSelect,
  order: { select: { id: true, orderNumber: true, companyId: true } },
} satisfies Prisma.OrderTaskSelect;

export function listTasksForOrder(companyId: number, orderId: number, taskCategory?: TaskCategory) {
  return prisma.orderTask.findMany({
    where: {
      orderId,
      order: { companyId },
      ...(taskCategory ? { taskCategory } : {}),
    },
    select: taskSelect,
    orderBy: [{ taskCategory: 'asc' }, { createdAt: 'asc' }],
  });
}

export function findTaskById(companyId: number, id: number, client: PrismaClientOrTx = prisma) {
  return client.orderTask.findFirst({
    where: { id, order: { companyId } },
    select: taskDetailSelect,
  });
}

export function createTask(data: Prisma.OrderTaskUncheckedCreateInput, client: PrismaClientOrTx = prisma) {
  return client.orderTask.create({ data, select: taskSelect });
}

export function updateTask(
  id: number,
  data: Prisma.OrderTaskUncheckedUpdateInput,
  client: PrismaClientOrTx = prisma,
) {
  return client.orderTask.update({ where: { id }, data, select: taskSelect });
}
