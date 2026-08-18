# Task Templates

## Purpose

The master checklist. Templates marked as default are copied into every new order's task list at
conversion time, so a confirmed order arrives with its standard planning and execution steps already
laid out.

## Source Files

```
server/src/modules/task-templates/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

| Table | Columns |
| --- | --- |
| `task_templates` | `task_name`, `task_category` (`PLANNING` / `EXECUTION`), `display_order`, `is_default`, `company_id`, timestamps, `deleted_at`. |

## API

Base path `/api/v1/task-templates`. All routes require authentication.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `MASTERS.canView` | Paginated list, filterable by `taskCategory` and search. |
| `GET` | `/:id` | `MASTERS.canView` | One template. |
| `POST` | `/` | `MASTERS.canCreate` | `{ taskName, taskCategory, displayOrder?, isDefault? }` |
| `PUT` | `/:id` | `MASTERS.canEdit` | Partial update. |
| `DELETE` | `/:id` | `MASTERS.canDelete` | Soft delete. |

## Business Rules

- Templates flagged `is_default` are seeded into an order's `order_tasks` inside the same
  transaction that creates the order — the order and its checklist must succeed together, otherwise
  the order would exist with no tasks (see [Orders](../orders/orders.md)).
- Seeding is a **copy, not a link**: editing a template afterwards does not rewrite the tasks of
  orders already created.
- `task_category` splits the checklist into the planning phase and the on-site execution phase.

## Frontend

Managed from the Masters screen (`client/src/pages/masters/MastersPage.tsx`); the seeded result is
what the Order Details → Task List tab renders
(`client/src/pages/orders/tabs/OrderTaskListTab.tsx`).

## Related Modules

[Tasks](../tasks/tasks.md) · [Orders](../orders/orders.md) · [Task Plan](../task-plan/task-plan.md)
