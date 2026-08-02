import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { buildPaginationMeta } from '../../utils/pagination';
import * as taskTemplatesRepository from './repository';
import { CreateTaskTemplateInput, ListTaskTemplatesParams, UpdateTaskTemplateInput } from './types';

export async function list(params: ListTaskTemplatesParams) {
  const { records, totalRecords } = await taskTemplatesRepository.listTaskTemplates(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export async function getById(companyId: string, id: string) {
  const taskTemplate = await taskTemplatesRepository.findTaskTemplateById(companyId, id);
  if (!taskTemplate) throw new AppError(404, 'Task template not found.');
  return taskTemplate;
}

export async function create(companyId: string, actorId: string, input: CreateTaskTemplateInput) {
  const taskTemplate = await taskTemplatesRepository.createTaskTemplate({
    companyId,
    taskName: input.taskName,
    taskCategory: input.taskCategory,
    displayOrder: input.displayOrder ?? 0,
    isDefault: input.isDefault ?? true,
  });

  await logActivity({
    companyId,
    module: 'MASTERS',
    referenceId: taskTemplate.id,
    action: 'CREATE',
    description: `Task template "${taskTemplate.taskName}" created.`,
    performedById: actorId,
  });

  return taskTemplate;
}

export async function update(companyId: string, actorId: string, id: string, input: UpdateTaskTemplateInput) {
  const existingTaskTemplate = await taskTemplatesRepository.findTaskTemplateById(companyId, id);
  if (!existingTaskTemplate) throw new AppError(404, 'Task template not found.');

  const taskTemplate = await taskTemplatesRepository.updateTaskTemplate(id, {
    taskName: input.taskName,
    taskCategory: input.taskCategory,
    displayOrder: input.displayOrder,
    isDefault: input.isDefault,
  });

  await logActivity({
    companyId,
    module: 'MASTERS',
    referenceId: taskTemplate.id,
    action: 'UPDATE',
    description: `Task template "${taskTemplate.taskName}" updated.`,
    performedById: actorId,
  });

  return taskTemplate;
}

export async function remove(companyId: string, actorId: string, id: string): Promise<void> {
  const existingTaskTemplate = await taskTemplatesRepository.findTaskTemplateById(companyId, id);
  if (!existingTaskTemplate) throw new AppError(404, 'Task template not found.');

  await taskTemplatesRepository.softDeleteTaskTemplate(id);

  await logActivity({
    companyId,
    module: 'MASTERS',
    referenceId: id,
    action: 'DELETE',
    description: `Task template "${existingTaskTemplate.taskName}" deleted.`,
    performedById: actorId,
  });
}
