# Permissions

## Purpose

The RBAC backbone. Defines which modules exist, which actions each one exposes, and how a user's
group grants plus their personal overrides resolve into the effective permission set enforced on
every request.

## Source Files

```
server/src/modules/permissions/
  catalog.ts      the single source of truth for (module, action) pairs
  controller.ts   routes.ts   service.ts   types.ts
server/src/middleware/authorize.ts
```

## Data

No table of its own. It reads `user_group_permissions` and `user_permission_overrides`, both of
which store grants as `(owner, module, action)` string rows.

### Modules

`DASHBOARD`, `ENQUIRIES`, `QUOTATIONS`, `ORDERS`, `PLANNING`, `PAYMENTS`, `CUSTOMERS`, `CALENDAR`,
`RENT`, `REPORTS`, `MASTERS`, `SETTINGS`

### Actions

`canView`, `canCreate`, `canEdit`, `canDelete`, `canApprove`, `canPrint`, `canExport`, `canAssign`,
`canChangeStatus`, `canConvertToOrder`, `canCancel`, `canCompleteEvent`, `canUpdateChecklist`

### Catalog

| Module | Label | Actions |
| --- | --- | --- |
| `DASHBOARD` | Dashboard | View |
| `ENQUIRIES` | Enquiries | View, Create, Edit, Delete, Assign, Change Status, Convert to Order, Export |
| `QUOTATIONS` | Quotations | View, Create, Edit, Approve, Print, Export |
| `ORDERS` | Orders | View, Create, Edit, Cancel Order, Complete Event, Export |
| `PLANNING` | Task Management | View, Create, Edit, Delete, Update Checklist |
| `PAYMENTS` | Payment Tracker | View, Create Payment, Edit Payment, Print Receipt, Export |
| `CUSTOMERS` | Customers | View, Edit, Export |
| `CALENDAR` | Calendar | View |
| `RENT` | Rent | View, Create, Edit, Delete, Print, Export |
| `REPORTS` | Reports | View, Export |
| `MASTERS` | Masters | View, Create, Edit, Delete |
| `SETTINGS` | Company Settings | View, Edit |

An action appears in the catalog only once a route or a UI affordance actually checks it — a
checkbox that gates nothing would promise access control the app does not perform.

## API

Base path `/api/v1/permissions`.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/catalog` | `MASTERS.canView` | The full module/action catalog that drives the permission matrix editor. |

## Business Rules

- **Resolution:** effective set = group permissions ∪ personal overrides. An override outranks the
  group's silence; anything neither grants stays denied.
- Both sets are filtered through the catalog, so a stale row can never widen access.
- Grants are emitted in catalog order rather than insertion order, so the payload reads identically
  for every user regardless of the order their grants were saved in.
- `DASHBOARD.canView` is enforced by the sidebar/nav gate only — the dashboard renders other
  modules' data, each authorized on its own endpoint, so there is no dashboard route to guard.

### Enforcement helpers

| Helper | Where | Use |
| --- | --- | --- |
| `authorize(module, action)` | `middleware/authorize.ts` | Unconditional route guard. |
| `authorizeWhen(predicate, module, action)` | `middleware/authorize.ts` | Guard that applies only when the request body matches — e.g. saving a quotation straight into `APPROVED` also needs `canApprove`. |
| `authorizeAny(...rules)` | `middleware/authorize.ts` | Passes if any rule matches — e.g. a task item update passes on `canEdit`, or on `canUpdateChecklist` when only the checklist fields were sent. |
| `requirePermission(...)` | `permissions/service.ts` | Service-layer check for rules that can only be decided with the stored record in hand — e.g. reassigning an enquiry needs `canAssign`, but only when the assignee actually changes. |

## Frontend

- `client/src/pages/masters/PermissionMatrixEditor.tsx`
- `client/src/services/permissionService.ts`
- `usePermission()` and `client/src/routes/ProtectedRoute.tsx` gate navigation and affordances.
  Frontend checks are convenience only — the server never trusts them.

## Related Modules

[Auth](../auth/auth.md) · [Users](../users/users.md) · [User Groups](../user-groups/user-groups.md)
