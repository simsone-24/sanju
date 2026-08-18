# Task Plan

## Purpose

The order's working plan. An order owns any number of user-defined task groups, each owning any
number of task items. A group is written as a draft, published when it is ready, and worked through
on site — a worker ticks tasks off, notes what happened, and attaches a proof photo.

## Source Files

```
server/src/modules/task-plan/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

Two routers: a top-level `/task-plan` for group and item operations, and an `orderTaskPlanRouter`
mounted by Orders at `/orders/:id/task-plan`.

## Data

| Table | Columns |
| --- | --- |
| `task_groups` | `order_id`, `title`, `description`, `status` (`DRAFT` / `PUBLISHED`), `display_order`, timestamps, `deleted_at`. Indexed on `(order_id, display_order)`. |
| `task_items` | `task_group_id`, `task_name`, `status` (`PENDING` / `IN_PROGRESS` / `COMPLETED`), `remarks`, `photo_path`, `completed_at`, `display_order`, timestamps, `deleted_at`. Indexed on `(task_group_id, display_order)`. |

`TaskItemStatus` is deliberately separate from the legacy `TaskStatus` used by the
[Tasks](../tasks/tasks.md) checklist, which additionally carries `SKIPPED`.

## API

All routes require authentication and use the **`PLANNING`** permission module.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/orders/:id/task-plan` | `PLANNING.canView` | Every group for the order, with items and progress. |
| `POST` | `/orders/:id/task-plan` | `PLANNING.canCreate` | Create a group and its first items in one transaction. |
| `PUT` | `/task-plan/groups/:id` | `PLANNING.canEdit` | `{ title?, description? }` |
| `PATCH` | `/task-plan/groups/:id/status` | `PLANNING.canEdit` | `{ status }` — publish or revert to draft. |
| `DELETE` | `/task-plan/groups/:id` | `PLANNING.canDelete` | Soft delete. |
| `POST` | `/task-plan/groups/:id/items` | `PLANNING.canCreate` | `{ taskName, status?, remarks? }` |
| `PUT` | `/task-plan/items/:id` | `canEdit`, **or** `canUpdateChecklist` for a checklist-only update | `{ taskName?, status?, remarks? }` |
| `DELETE` | `/task-plan/items/:id` | `PLANNING.canDelete` | Soft delete. |
| `GET` | `/task-plan/items/:id/photo` | `PLANNING.canView` | Streams the completion photo. |
| `POST` | `/task-plan/items/:id/photo` | `canEdit` **or** `canUpdateChecklist` | `multipart/form-data`, field `photo`, image only, max **5 MB**. |
| `DELETE` | `/task-plan/items/:id/photo` | `canEdit` **or** `canUpdateChecklist` | Remove the photo. |

### Create-group payload

```
title:        1–150 chars, required
description?: ≤ 1000 chars
status?:      'DRAFT' | 'PUBLISHED'      — "Save" publishes, "Save as Draft" does not
items?:       [{ taskName ≤ 200, status?, remarks? ≤ 1000 }]   max 100 per create
```

## Business Rules

### Checklist-only updates

A worker is given View plus Update Checklist and nothing else: enough to tick a task off and note
what happened, not enough to rename or restructure the plan. An update that touches **only**
`status` and `remarks` therefore passes on `canUpdateChecklist`; renaming a task still needs
`canEdit`. The completion photo is the proof half of ticking a task off, so it follows the same
rule.

### Status transitions

- **Every** transition between the three item states is allowed. A checkbox has to work in both
  directions, and a task ticked by mistake must be recoverable. `PENDING → COMPLETED` directly is
  what ticking an untouched task does.
- A **draft group** may be published once it is ready. A **published group** may be pulled back to
  draft only while the team has not started on it — reverting a group whose tasks are already under
  way would hide work in progress from the order's totals.
- Draft groups are excluded from the order's progress totals and marked as such on the card.

### Derived values

- Progress is `Completed Tasks / Total Tasks × 100`, derived on every read rather than stored, so it
  can never drift from the underlying items.
- `completed_at` is **server-generated, never accepted from the client**, and cleared again when a
  task is reopened, so it always describes the current status.

### Photos

- `photo_path` is never returned to the client. The file is reachable only through the authenticated
  `GET .../photo` route, so the response exposes a boolean instead of a disk path.
- On delete, the database row is the source of truth — an already-missing file needs no action.

## Frontend

- `client/src/pages/orders/tabs/OrderTaskPlanTab.tsx`
- `client/src/pages/orders/TaskPlanGroupCard.tsx`, `TaskItemPhotoDialog.tsx`
- `client/src/services/taskPlanService.ts`

## Related Modules

[Orders](../orders/orders.md) · [Tasks](../tasks/tasks.md) ·
[Task Templates](../task-templates/task-templates.md)
