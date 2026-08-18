import { TaskCategory } from '@prisma/client';

export interface CreateTaskTemplateInput {
  taskName: string;
  taskCategory: TaskCategory;
  displayOrder?: number;
  isDefault?: boolean;
}

export interface UpdateTaskTemplateInput {
  taskName?: string;
  taskCategory?: TaskCategory;
  displayOrder?: number;
  isDefault?: boolean;
}

export interface ListTaskTemplatesParams {
  companyId: number;
  page: number;
  limit: number;
  search?: string;
  taskCategory?: TaskCategory;
}
