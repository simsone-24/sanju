export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type TaskCategory = 'PLANNING' | 'EXECUTION';

export interface OrderTaskDetail {
  id: string;
  taskName: string;
  taskCategory: TaskCategory;
  status: TaskStatus;
  dueDate: string | null;
  completedDate: string | null;
  remarks: string | null;
  assignedTo: { id: string; fullName: string } | null;
  completedBy: { id: string; fullName: string } | null;
}

export interface CreateTaskInput {
  taskName: string;
  taskCategory: TaskCategory;
  assignedToId?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  remarks?: string;
  assignedToId?: string;
  dueDate?: string;
}
