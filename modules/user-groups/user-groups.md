# User Groups

## Purpose

Role definitions. A group carries a name, a status and the set of `(module, action)` permissions
every user in it inherits.

## Source Files

```
server/src/modules/user-groups/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

| Table | Role |
| --- | --- |
| `user_groups` | `group_name` (unique per company), `description`, `status` (`ACTIVE` / `INACTIVE`), `company_id`. |
| `user_group_permissions` | One row per granted `(module, action)`; unique on the group + module + action. |

Storing permissions as rows rather than one boolean column per action means a new module or action
needs no schema change and no migration.

## API

Base path `/api/v1/user-groups`. All routes require authentication.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `MASTERS.canView` | Paginated list with search and status filter. |
| `GET` | `/options` | `MASTERS.canView` | `{ id, groupName }` list for the user form's dropdown. |
| `GET` | `/:id` | `MASTERS.canView` | Group with its full permission set. |
| `POST` | `/` | `MASTERS.canCreate` | Creates the group and its permissions together. |
| `PUT` | `/:id` | `MASTERS.canEdit` | Partial update; permissions replaced only when sent. |
| `DELETE` | `/:id` | `MASTERS.canDelete` | Soft delete. |

`/options` is registered before `/:id` so the literal is not captured as an id.

## Business Rules

- Group names are unique — a duplicate returns `409 A user group with this name already exists.`
- **A group cannot be deleted while users are assigned to it.**
- An inactive group cannot be assigned to a user (enforced in [Users](../users/users.md)).
- Permissions are only rewritten when the caller sends them; updating the name or description alone
  leaves access exactly as it was.
- Submitted grants are de-duplicated before writing, so a repeated pair in one request can never hit
  the unique key.
- Grants are filtered through the permission catalog on resolution, so a row left behind by a
  removed or renamed module grants nothing until it is cleaned up.

## Frontend

- `client/src/pages/masters/tabs/UserGroupsTab.tsx`
- `client/src/pages/masters/UserGroupFormDialog.tsx`
- `client/src/pages/masters/PermissionMatrixEditor.tsx`
- `client/src/services/userGroupService.ts`

## Related Modules

[Users](../users/users.md) · [Permissions](../permissions/permissions.md)
