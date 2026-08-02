import type { TaskStatus } from '../../types/task';

// Mirrors server/src/modules/tasks/service.ts's TASK_STATUS_TRANSITIONS exactly. PENDING can
// jump straight to COMPLETED — docs/03_MODULES.md Tab 5 describes "checkbox-based execution,"
// which doesn't require an explicit in-progress step for simple checklist items.
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
  IN_PROGRESS: ['COMPLETED', 'SKIPPED'],
  COMPLETED: [],
  SKIPPED: [],
};
