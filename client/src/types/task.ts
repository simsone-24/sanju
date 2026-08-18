export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
export type TaskCategory = 'PLANNING' | 'EXECUTION';

export interface OrderTaskDetail {
  id: number;
  taskName: string;
  taskCategory: TaskCategory;
  status: TaskStatus;
  dueDate: string | null;
  completedDate: string | null;
  remarks: string | null;
  assignedTo: { id: number; fullName: string } | null;
  completedBy: { id: number; fullName: string } | null;
}

export interface CreateTaskInput {
  taskName: string;
  taskCategory: TaskCategory;
  assignedToId?: number;
  dueDate?: string;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  remarks?: string;
  assignedToId?: number;
  dueDate?: string;
}
