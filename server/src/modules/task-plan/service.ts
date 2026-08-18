import fs from 'fs/promises';
import path from 'path';
import { TaskGroupStatus, TaskItemStatus } from '@prisma/client';
import * as ordersRepository from '../orders/repository';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import * as taskPlanRepository from './repository';
import {
  CreateTaskGroupInput,
  CreateTaskItemInput,
  TaskGroupView,
  TaskItemView,
  UpdateTaskGroupInput,
  UpdateTaskItemInput,
  UploadedPhoto,
} from './types';

// "md files/task plan/scope.md" §Task Status documents Pending → In Progress → Completed, and
// §Screen Layout drives the same statuses from a checkbox. A checkbox has to work in both
// directions, and a task ticked by mistake must be recoverable, so every transition between the
// three states is allowed rather than treating Completed as terminal. Pending → Completed direct
// is what ticking an untouched task does.
const TASK_ITEM_STATUS_TRANSITIONS: Record<TaskItemStatus, TaskItemStatus[]> = {
  PENDING: [TaskItemStatus.IN_PROGRESS, TaskItemStatus.COMPLETED],
  IN_PROGRESS: [TaskItemStatus.PENDING, TaskItemStatus.COMPLETED],
  COMPLETED: [TaskItemStatus.PENDING, TaskItemStatus.IN_PROGRESS],
};

interface RawTaskItem {
  id: number;
  taskName: string;
  status: TaskItemStatus;
  remarks: string | null;
  photoPath: string | null;
  completedAt: Date | null;
  displayOrder: number;
}

interface RawTaskGroup {
  id: number;
  title: string;
  description: string | null;
  status: TaskGroupStatus;
  displayOrder: number;
  items: RawTaskItem[];
}

// photoPath is never returned to the client — the file is reachable only through the
// authenticated GET .../photo route, so the response exposes a boolean instead of a disk path.
function toItemView(item: RawTaskItem): TaskItemView {
  return {
    id: item.id,
    taskName: item.taskName,
    status: item.status,
    remarks: item.remarks,
    hasPhoto: Boolean(item.photoPath),
    completedAt: item.completedAt,
    displayOrder: item.displayOrder,
  };
}

// scope.md §Progress Calculation — Completed Tasks / Total Tasks × 100, derived on every read
// rather than stored, so it can never drift from the underlying items.
function toGroupView(group: RawTaskGroup): TaskGroupView {
  const totalTasks = group.items.length;
  const completedTasks = group.items.filter((item) => item.status === TaskItemStatus.COMPLETED).length;

  return {
    id: group.id,
    title: group.title,
    description: group.description,
    status: group.status,
    displayOrder: group.displayOrder,
    totalTasks,
    completedTasks,
    progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    items: group.items.map(toItemView),
  };
}

async function requireOrder(companyId: number, orderId: number) {
  const order = await ordersRepository.findOrderById(companyId, orderId);
  if (!order) throw new AppError(404, 'Order not found.');
  return order;
}

async function requireGroup(companyId: number, id: number) {
  const group = await taskPlanRepository.findGroupById(companyId, id);
  if (!group) throw new AppError(404, 'Task group not found.');
  return group;
}

async function requireItem(companyId: number, id: number) {
  const item = await taskPlanRepository.findItemById(companyId, id);
  if (!item) throw new AppError(404, 'Task not found.');
  return item;
}

/** Best-effort cleanup of a replaced/removed photo — a missing file must not fail the request. */
async function removePhotoFile(relativePath: string | null): Promise<void> {
  if (!relativePath) return;
  try {
    await fs.unlink(path.resolve(env.uploadPath, relativePath));
  } catch {
    // The database row is the source of truth; an already-missing file needs no action.
  }
}

export async function listGroups(companyId: number, orderId: number): Promise<TaskGroupView[]> {
  await requireOrder(companyId, orderId);
  const groups = await taskPlanRepository.listGroupsForOrder(companyId, orderId);
  return groups.map(toGroupView);
}

export async function createGroup(
  companyId: number,
  actorId: number,
  orderId: number,
  input: CreateTaskGroupInput,
): Promise<TaskGroupView> {
  const order = await requireOrder(companyId, orderId);

  const status = input.status ?? TaskGroupStatus.PUBLISHED;

  const group = await taskPlanRepository.createGroup(
    {
      orderId,
      title: input.title,
      description: input.description,
      status,
      displayOrder: await taskPlanRepository.nextGroupDisplayOrder(orderId),
    },
    (input.items ?? []).map((item, index) => ({
      taskName: item.taskName,
      status: item.status ?? TaskItemStatus.PENDING,
      remarks: item.remarks,
      displayOrder: index,
      completedAt: item.status === TaskItemStatus.COMPLETED ? new Date() : null,
    })),
  );

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: group.id,
    action: 'CREATE',
    description: `${status === TaskGroupStatus.DRAFT ? 'Draft task group' : 'Task group'} "${group.title}" with ${
      group.items.length
    } task(s) added to order "${order.orderNumber}".`,
    performedById: actorId,
  });

  return toGroupView(group);
}

// A draft is a plan still being written, so it may be published once it is ready, and a published
// group may be pulled back to draft only while the team has not started on it — reverting a group
// whose tasks are already under way would hide work in progress from the order's totals.
const TASK_GROUP_STATUS_TRANSITIONS: Record<TaskGroupStatus, TaskGroupStatus[]> = {
  DRAFT: [TaskGroupStatus.PUBLISHED],
  PUBLISHED: [TaskGroupStatus.DRAFT],
};

export async function changeGroupStatus(
  companyId: number,
  actorId: number,
  id: number,
  status: TaskGroupStatus,
): Promise<TaskGroupView> {
  const existing = await requireGroup(companyId, id);

  if (existing.status === status) {
    throw new AppError(400, `This task group is already ${status.toLowerCase()}.`);
  }
  if (!TASK_GROUP_STATUS_TRANSITIONS[existing.status].includes(status)) {
    throw new AppError(400, `Cannot change a task group from ${existing.status} to ${status}.`);
  }
  if (status === TaskGroupStatus.DRAFT) {
    const started = existing.items.filter((item) => item.status !== TaskItemStatus.PENDING).length;
    if (started > 0) {
      throw new AppError(
        400,
        `"${existing.title}" cannot go back to draft — ${started} of its task(s) have already been started.`,
      );
    }
  }

  const group = await taskPlanRepository.updateGroup(id, { status });

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: id,
    action: 'STATUS_CHANGE',
    description:
      status === TaskGroupStatus.PUBLISHED
        ? `Task group "${existing.title}" published to the team.`
        : `Task group "${existing.title}" moved back to draft.`,
    performedById: actorId,
  });

  return toGroupView(group);
}

export async function updateGroup(
  companyId: number,
  actorId: number,
  id: number,
  input: UpdateTaskGroupInput,
): Promise<TaskGroupView> {
  const existing = await requireGroup(companyId, id);

  const group = await taskPlanRepository.updateGroup(id, {
    title: input.title,
    description: input.description,
  });

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: id,
    action: 'UPDATE',
    description: `Task group "${existing.title}" updated.`,
    performedById: actorId,
  });

  return toGroupView(group);
}

export async function deleteGroup(companyId: number, actorId: number, id: number): Promise<void> {
  const existing = await requireGroup(companyId, id);

  await taskPlanRepository.softDeleteGroupWithItems(id);

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: id,
    action: 'DELETE',
    description: `Task group "${existing.title}" and its ${existing.items.length} task(s) deleted from order "${existing.order.orderNumber}".`,
    performedById: actorId,
  });
}

export async function createItem(
  companyId: number,
  actorId: number,
  groupId: number,
  input: CreateTaskItemInput,
): Promise<TaskItemView> {
  const group = await requireGroup(companyId, groupId);
  const status = input.status ?? TaskItemStatus.PENDING;

  const item = await taskPlanRepository.createItem({
    taskGroupId: groupId,
    taskName: input.taskName,
    status,
    remarks: input.remarks,
    displayOrder: await taskPlanRepository.nextItemDisplayOrder(groupId),
    // scope.md §Task Item Fields — "Completed At" is auto, saved when marked completed.
    completedAt: status === TaskItemStatus.COMPLETED ? new Date() : null,
  });

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: item.id,
    action: 'CREATE',
    description: `Task "${item.taskName}" added to task group "${group.title}".`,
    performedById: actorId,
  });

  return toItemView(item);
}

export async function updateItem(
  companyId: number,
  actorId: number,
  id: number,
  input: UpdateTaskItemInput,
): Promise<TaskItemView> {
  const existing = await requireItem(companyId, id);

  const isStatusChange = Boolean(input.status) && input.status !== existing.status;
  if (input.status && isStatusChange) {
    const allowedNext = TASK_ITEM_STATUS_TRANSITIONS[existing.status];
    if (!allowedNext.includes(input.status)) {
      throw new AppError(400, `Cannot change status from ${existing.status} to ${input.status}.`, [
        { field: 'status', message: `Allowed next status(es): ${allowedNext.join(', ')}.` },
      ]);
    }
  }

  // Completion time is server-generated, never accepted from the client, and cleared again when a
  // task is reopened so it always describes the current status.
  const completedAtChange = isStatusChange
    ? { completedAt: input.status === TaskItemStatus.COMPLETED ? new Date() : null }
    : {};

  const item = await taskPlanRepository.updateItem(id, {
    taskName: input.taskName,
    status: input.status,
    remarks: input.remarks,
    ...completedAtChange,
  });

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: id,
    action: isStatusChange ? 'STATUS_CHANGE' : 'UPDATE',
    description: isStatusChange
      ? `Task "${existing.taskName}" status changed from ${existing.status} to ${input.status}.`
      : `Task "${existing.taskName}" updated.`,
    performedById: actorId,
  });

  return toItemView(item);
}

export async function deleteItem(companyId: number, actorId: number, id: number): Promise<void> {
  const existing = await requireItem(companyId, id);

  await taskPlanRepository.softDeleteItem(id);
  await removePhotoFile(existing.photoPath);

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: id,
    action: 'DELETE',
    description: `Task "${existing.taskName}" deleted from task group "${existing.taskGroup.title}".`,
    performedById: actorId,
  });
}

/** scope.md §Completion Photo — always optional, and replacing one discards the previous file. */
export async function uploadItemPhoto(
  companyId: number,
  actorId: number,
  id: number,
  photo: UploadedPhoto,
): Promise<TaskItemView> {
  const existing = await requireItem(companyId, id);

  const item = await taskPlanRepository.updateItem(id, { photoPath: photo.path });
  await removePhotoFile(existing.photoPath);

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: id,
    action: 'UPDATE',
    description: `Completion photo uploaded for task "${existing.taskName}".`,
    performedById: actorId,
  });

  return toItemView(item);
}

export async function removeItemPhoto(companyId: number, actorId: number, id: number): Promise<TaskItemView> {
  const existing = await requireItem(companyId, id);
  if (!existing.photoPath) throw new AppError(404, 'This task has no completion photo.');

  const item = await taskPlanRepository.updateItem(id, { photoPath: null });
  await removePhotoFile(existing.photoPath);

  await logActivity({
    companyId,
    module: 'PLANNING',
    referenceId: id,
    action: 'DELETE',
    description: `Completion photo removed from task "${existing.taskName}".`,
    performedById: actorId,
  });

  return toItemView(item);
}

export async function getItemPhotoPath(companyId: number, id: number): Promise<string> {
  const item = await requireItem(companyId, id);
  if (!item.photoPath) throw new AppError(404, 'This task has no completion photo.');
  return item.photoPath;
}
