import type { TaskGroupDetail, TaskItemStatus } from '../../types/taskPlan';

// Repeats the server's own progress calculation (scope.md §Progress Calculation — Completed /
// Total × 100, implemented in server/src/modules/task-plan/service.ts's toGroupView) so an
// optimistic change shows exactly the numbers the confirming refetch will bring back.
function withRecalculatedProgress(group: TaskGroupDetail): TaskGroupDetail {
  const totalTasks = group.items.length;
  const completedTasks = group.items.filter((item) => item.status === 'COMPLETED').length;

  return {
    ...group,
    totalTasks,
    completedTasks,
    progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
}

/**
 * The cached task plan with one task's status changed. Ticking a checkbox is the module's most
 * frequent action, so the row, its badge and the group's progress bar all move in the same frame
 * as the click rather than after a round trip; the mutation still refetches to confirm, and
 * rolls this back if the server refuses. Groups that don't hold the task are returned untouched.
 */
export function applyItemStatus(
  groups: TaskGroupDetail[] | undefined,
  itemId: string,
  status: TaskItemStatus,
): TaskGroupDetail[] | undefined {
  if (!groups) return groups;

  // Completion time is server-generated (scope.md §Task Item Fields). This local stand-in only
  // has to read correctly for the moment before the refetch replaces it with the stored value.
  const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;

  return groups.map((group) => {
    if (!group.items.some((item) => item.id === itemId)) return group;

    return withRecalculatedProgress({
      ...group,
      items: group.items.map((item) => (item.id === itemId ? { ...item, status, completedAt } : item)),
    });
  });
}
