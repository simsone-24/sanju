export type TaskItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

/** A group still being written (DRAFT) versus one the team executes (PUBLISHED). */
export type TaskGroupStatus = 'DRAFT' | 'PUBLISHED';

export interface TaskItemDetail {
  id: string;
  taskName: string;
  status: TaskItemStatus;
  remarks: string | null;
  /** The photo itself is fetched separately through an authenticated endpoint. */
  hasPhoto: boolean;
  completedAt: string | null;
  displayOrder: number;
}

export interface TaskGroupDetail {
  id: string;
  title: string;
  description: string | null;
  status: TaskGroupStatus;
  displayOrder: number;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  items: TaskItemDetail[];
}

export interface CreateTaskGroupInput {
  title: string;
  description?: string;
  /** DRAFT from the form's "Save as Draft" action; the server defaults to PUBLISHED. */
  status?: TaskGroupStatus;
  /** Tasks entered in the same form as the group — the server creates them with it. */
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
