# Tasks

## Purpose

The order's flat task checklist, seeded from the default task templates at conversion. Planning
tasks and execution tasks share one table, told apart by `task_category`.

Retained alongside the newer, richer [Task Plan](../task-plan/task-plan.md) so existing order data
stays readable.

## Source Files

```
server/src/modules/tasks/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

Two routers: a top-level `/tasks` for updating a single task, and an `orderTasksRouter` mounted by
Orders at `/orders/:id/tasks`.

## Data

| Table | Columns |
| --- | --- |
| `order_tasks` | `order_id`, `task_name`, `task_category` (`PLANNING` / `EXECUTION`), `assigned_to_id`, `due_date`, `completed_date`, `completed_by_id`, `remarks`, `status`, timestamps. |

`TaskStatus`: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`.

## API

All routes require authentication and use the **`PLANNING`** permission module.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/orders/:id/tasks` | `PLANNING.canView` | The order's tasks, filterable by `taskCategory`. |
| `POST` | `/orders/:id/tasks` | `PLANNING.canCreate` | `{ taskName, taskCategory, assignedToId?, dueDate? }` |
| `PATCH` | `/tasks/:id` | `PLANNING.canEdit` | `{ status?, remarks?, assignedToId?, dueDate? }` |

## Business Rules

- Tasks are seeded from the default [Task Templates](../task-templates/task-templates.md) in the
  same transaction that creates the order.
- `PENDING` can go **straight to** `COMPLETED` — the checklist is checkbox-based execution and does
  not require an explicit in-progress step.
- "Completed By" and "Completed Date" are always **server-derived from the acting request**, never
  trusted from the client.
- An assignee must exist (`400 Selected assignee does not exist.`).
- The two categories are the same table: `PLANNING` drives the planning view, `EXECUTION` the
  on-site checklist.

## Frontend

- `client/src/pages/orders/tabs/OrderTaskListTab.tsx`
- `client/src/services/taskService.ts`

## Related Modules

[Task Plan](../task-plan/task-plan.md) · [Task Templates](../task-templates/task-templates.md) ·
[Orders](../orders/orders.md)
