import { TaskStatus } from '@prisma/client';
import * as enquiriesRepository from '../enquiries/repository';
import * as ordersRepository from '../orders/repository';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import * as tasksRepository from './repository';
import { CreateOrderTaskInput, ListOrderTasksParams, UpdateOrderTaskInput } from './types';

// PENDING can go straight to COMPLETED — 03_MODULES.md Tab 5 describes "Checkbox-based
// execution," which doesn't require an explicit in-progress step for simple checklist items.
const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.SKIPPED],
  IN_PROGRESS: [TaskStatus.COMPLETED, TaskStatus.SKIPPED],
  COMPLETED: [],
  SKIPPED: [],
};

export async function list(params: ListOrderTasksParams) {
  const order = await ordersRepository.findOrderById(params.companyId, params.orderId);
  if (!order) throw new AppError(404, 'Order not found.');
  return tasksRepository.listTasksForOrder(params.companyId, params.orderId, params.taskCategory);
}

export async function create(companyId: number, actorId: number, orderId: number, input: CreateOrderTaskInput) {
  const order = await ordersRepository.findOrderById(companyId, orderId);
  if (!order) throw new AppError(404, 'Order not found.');

  if (input.assignedToId) {
    const assignee = await enquiriesRepository.findUserForCompany(companyId, input.assignedToId);
    if (!assignee) {
      throw new AppError(400, 'Selected assignee does not exist.', [
        { field: 'assignedToId', message: 'Selected assignee does not exist.' },
      ]);
    }
  }

  const task = await tasksRepository.createTask({
    orderId,
    taskName: input.taskName,
    taskCategory: input.taskCategory,
    assignedToId: input.assignedToId,
    dueDate: input.dueDate,
    status: TaskStatus.PENDING,
  });

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: task.id,
    action: 'CREATE',
    description: `Task "${task.taskName}" added to order "${order.orderNumber}".`,
    performedById: actorId,
  });

  return task;
}

export async function update(companyId: number, actorId: number, id: number, input: UpdateOrderTaskInput) {
  const existing = await tasksRepository.findTaskById(companyId, id);
  if (!existing) throw new AppError(404, 'Task not found.');

  if (input.assignedToId) {
    const assignee = await enquiriesRepository.findUserForCompany(companyId, input.assignedToId);
    if (!assignee) {
      throw new AppError(400, 'Selected assignee does not exist.', [
        { field: 'assignedToId', message: 'Selected assignee does not exist.' },
      ]);
    }
  }

  if (input.status) {
    const allowedNext = TASK_STATUS_TRANSITIONS[existing.status];
    if (!allowedNext.includes(input.status)) {
      throw new AppError(400, `Cannot change status from ${existing.status} to ${input.status}.`, [
        {
          field: 'status',
          message: `Allowed next status(es): ${allowedNext.length ? allowedNext.join(', ') : 'none (terminal status)'}.`,
        },
      ]);
    }
  }

  // "Completed By" / "Date" are always server-derived from the acting request — never trusted
  // from the client — per 03_MODULES.md Tab 5's documented per-task fields.
  const isCompleting = input.status === TaskStatus.COMPLETED;

  const task = await tasksRepository.updateTask(id, {
    status: input.status,
    remarks: input.remarks,
    assignedToId: input.assignedToId,
    dueDate: input.dueDate,
    ...(isCompleting ? { completedById: actorId, completedDate: new Date() } : {}),
  });

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: id,
    action: input.status ? 'STATUS_CHANGE' : 'UPDATE',
    description: input.status
      ? `Task "${existing.taskName}" status changed from ${existing.status} to ${input.status}.`
      : `Task "${existing.taskName}" updated.`,
    performedById: actorId,
  });

  return task;
}
