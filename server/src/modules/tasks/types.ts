import { TaskCategory, TaskStatus } from '@prisma/client';

export interface CreateOrderTaskInput {
  taskName: string;
  taskCategory: TaskCategory;
  assignedToId?: number;
  dueDate?: Date;
}

export interface UpdateOrderTaskInput {
  status?: TaskStatus;
  remarks?: string;
  assignedToId?: number;
  dueDate?: Date;
}

export interface ListOrderTasksParams {
  companyId: number;
  orderId: number;
  taskCategory?: TaskCategory;
}
