import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ListTaskTemplatesParams } from './types';

const taskTemplateSelect = {
  id: true,
  taskName: true,
  taskCategory: true,
  displayOrder: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaskTemplateSelect;

export async function listTaskTemplates(params: ListTaskTemplatesParams) {
  const where: Prisma.TaskTemplateWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(params.taskCategory ? { taskCategory: params.taskCategory } : {}),
    ...(params.search ? { taskName: { contains: params.search } } : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.taskTemplate.findMany({
      where,
      select: taskTemplateSelect,
      orderBy: [{ taskCategory: 'asc' }, { displayOrder: 'asc' }, { taskName: 'asc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.taskTemplate.count({ where }),
  ]);

  return { records, totalRecords };
}

export function findTaskTemplateById(companyId: string, id: string) {
  return prisma.taskTemplate.findFirst({
    where: { id, companyId, deletedAt: null },
    select: taskTemplateSelect,
  });
}

export function createTaskTemplate(data: Prisma.TaskTemplateUncheckedCreateInput) {
  return prisma.taskTemplate.create({ data, select: taskTemplateSelect });
}

export function updateTaskTemplate(id: string, data: Prisma.TaskTemplateUpdateInput) {
  return prisma.taskTemplate.update({ where: { id }, data, select: taskTemplateSelect });
}

export function softDeleteTaskTemplate(id: string) {
  return prisma.taskTemplate.update({ where: { id }, data: { deletedAt: new Date() } });
}
