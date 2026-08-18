# Users

## Purpose

The staff master: who can sign in, which user group they belong to, and any extra permissions
granted to them personally on top of that group. Also supplies the lightweight name list that the
"Assigned To" and "Coordinator" pickers use elsewhere in the app.

## Source Files

```
server/src/modules/users/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
server/src/middleware/upload.ts   (profile photo uploader)
```

## Data

| Table | Role |
| --- | --- |
| `users` | The account: `full_name`, `username` (unique), `email` (unique), `mobile`, `city`, `password_hash`, `profile_photo`, `is_active`, `user_group_id`, `company_id`. |
| `user_permission_overrides` | Personal `(module, action)` grants layered on top of the group. |

Soft delete via `deleted_at`.

## API

Base path `/api/v1/users`. All routes require authentication.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/options` | authenticated only | `{ id, fullName }` list for assignment pickers. |
| `GET` | `/` | `MASTERS.canView` | Paginated list with search and filters. |
| `GET` | `/:id` | `MASTERS.canView` | One user with their group and overrides. |
| `GET` | `/:id/photo` | `MASTERS.canView` | Streams the profile photo. |
| `POST` | `/` | `MASTERS.canCreate` | Creates the account and its overrides in one nested write. |
| `PUT` | `/:id` | `MASTERS.canEdit` | Partial update; overrides replaced only when sent. |
| `POST` | `/:id/photo` | `MASTERS.canEdit` | `multipart/form-data`, field `photo`, image only, max **2 MB**. |
| `DELETE` | `/:id` | `MASTERS.canDelete` | Soft delete. |

## Business Rules

- `GET /options` is deliberately **not** behind `MASTERS`: the enquiry and order assignment
  dropdowns need it, and those roles hold no Masters rights. It exposes id and name only.
- Username and email are unique — a duplicate returns `409`.
- An **inactive user group cannot be assigned**, on create or on edit. A user already sitting in a
  group that was later deactivated keeps it until an administrator moves them.
- Permission overrides are only touched when the caller sends them, so editing a profile alone
  leaves the user's extra access untouched. They are written before the user row is re-read, so the
  response reflects them.
- Optional fields are written only when present in the payload; an empty string is an explicit
  "clear this value", an omitted field means "leave as it is".
- Profile photos are staff PII, so they are served through the authenticated `/:id/photo` route
  rather than the public `/uploads` mount — the same treatment order documents and task photos get.

## Frontend

- `client/src/pages/masters/tabs/UsersTab.tsx`
- `client/src/pages/masters/UserFormDialog.tsx`
- `client/src/pages/masters/PermissionMatrixEditor.tsx`
- `client/src/services/userService.ts`

## Related Modules

[User Groups](../user-groups/user-groups.md) · [Permissions](../permissions/permissions.md) · [Auth](../auth/auth.md)
