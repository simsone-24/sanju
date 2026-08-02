import { TaskGroupStatus, TaskItemStatus } from '@prisma/client';

export interface CreateTaskGroupInput {
  title: string;
  description?: string;
  /** DRAFT when saved from the form's "Save as Draft" action; defaults to PUBLISHED. */
  status?: TaskGroupStatus;
  /** Tasks typed into the same form as the group — created with it, in one transaction. */
  items?: CreateTaskItemInput[];
}

export interface UpdateTaskGroupInput {
  title?: string;
  description?: string;
}

export interface CreateTaskItemInput {
  taskName: string;
  status?: TaskItemStatus;
  remarks?: string;
}

export interface UpdateTaskItemInput {
  taskName?: string;
  status?: TaskItemStatus;
  remarks?: string;
}

export interface UploadedPhoto {
  /** Path relative to env.uploadPath, stored on the task item. */
  path: string;
}

export interface TaskItemView {
  id: string;
  taskName: string;
  status: TaskItemStatus;
  remarks: string | null;
  hasPhoto: boolean;
  completedAt: Date | null;
  displayOrder: number;
}

/** A group plus its dynamically calculated progress — never stored, always derived. */
export interface TaskGroupView {
  id: string;
  title: string;
  description: string | null;
  status: TaskGroupStatus;
  displayOrder: number;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  items: TaskItemView[];
}
