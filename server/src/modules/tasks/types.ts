import { TaskCategory, TaskStatus } from '@prisma/client';

export interface CreateOrderTaskInput {
  taskName: string;
  taskCategory: TaskCategory;
  assignedToId?: string;
  dueDate?: Date;
}

export interface UpdateOrderTaskInput {
  status?: TaskStatus;
  remarks?: string;
  assignedToId?: string;
  dueDate?: Date;
}

export interface ListOrderTasksParams {
  companyId: string;
  orderId: string;
  taskCategory?: TaskCategory;
}
