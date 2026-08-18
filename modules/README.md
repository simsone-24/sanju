# Modules

Module documentation for the Event Management ERP. One folder per backend module in
`server/src/modules/`, each holding a single `<module>.md` describing what that module owns.

Every document follows the same sections: **Purpose**, **Source Files**, **Data**, **API**,
**Business Rules**, **Frontend** and **Related Modules**.

---

## Conventions

| Topic | Rule |
| --- | --- |
| API base path | All routes are mounted under `/api/v1` (`server/src/routes/index.ts`). |
| Layering | `controller.ts` → `service.ts` → `repository.ts`. No business logic in controllers, no Prisma in controllers. |
| Auth | Every module router calls `authenticate` first. Public routes exist only in `auth`. |
| RBAC | `authorize(module, action)` / `authorizeWhen(...)` / `authorizeAny(...)` from `middleware/authorize.ts`, using `ModuleName` from `modules/permissions/catalog.ts`. |
| Validation | Zod schemas in `validation.ts`, applied by `middleware/validate.ts`. Business validation lives in the service. |
| Responses | `{ success, message, data }` on success, `{ success, message, errors }` on failure (`utils/response.ts`, `middleware/errorHandler.ts`). |
| Errors | Thrown as `AppError(status, message)`; database errors are never surfaced. |
| Soft delete | Transactional tables carry `created_at` / `updated_at` / `deleted_at`; deletes set `deleted_at`. |
| Document numbers | `utils/numberGenerator.ts` — `PREFIX-YYYY-NNNNN`, per company, reset each calendar year. |
| Activity log | `utils/activityLogger.ts` writes to `activity_logs` for create, update, delete, payment, conversion and status change. |

### Document number prefixes

| Sequence | Prefix | Issued by |
| --- | --- | --- |
| `ENQUIRY` | `ENQ` | Enquiries |
| `QUOTATION` | `QTN` | Quotations |
| `ORDER` | `ORD` | Orders |
| `RECEIPT` | `RCT` | Payments / Payment Tracker |
| `INVOICE` | `INV` | Invoices |
| `CUSTOMER` | `CUS` | Customers (auto-created) |
| `RENT_OUT` | `RENT-OUT` | Rent — Stock Outs |
| `RENT_RETURN` | `RENT-RET` | Rent — Returns |
| `RENT_PAYMENT` | `RENT-PAY` | Rent — Payments |

---

## Module Map

### Access control & masters

| Module | Mount | RBAC module | Document |
| --- | --- | --- | --- |
| Auth | `/auth` | — (public + authenticated) | [auth/auth.md](auth/auth.md) |
| Users | `/users` | `MASTERS` | [users/users.md](users/users.md) |
| User Groups | `/user-groups` | `MASTERS` | [user-groups/user-groups.md](user-groups/user-groups.md) |
| Permissions | `/permissions` | `MASTERS` | [permissions/permissions.md](permissions/permissions.md) |
| Event Types | `/event-types` | `MASTERS` | [event-types/event-types.md](event-types/event-types.md) |
| Task Templates | `/task-templates` | `MASTERS` | [task-templates/task-templates.md](task-templates/task-templates.md) |
| Payment Methods | `/payment-methods` | — (authenticated) | [payment-methods/payment-methods.md](payment-methods/payment-methods.md) |
| Settings | `/settings` | `SETTINGS` | [settings/settings.md](settings/settings.md) |

### Sales pipeline

| Module | Mount | RBAC module | Document |
| --- | --- | --- | --- |
| Customers | `/customers` | `CUSTOMERS` | [customers/customers.md](customers/customers.md) |
| Enquiries | `/enquiries` | `ENQUIRIES` | [enquiries/enquiries.md](enquiries/enquiries.md) |
| Quotations | `/quotations` | `QUOTATIONS` | [quotations/quotations.md](quotations/quotations.md) |
| Orders | `/orders` | `ORDERS` | [orders/orders.md](orders/orders.md) |

### Money

| Module | Mount | RBAC module | Document |
| --- | --- | --- | --- |
| Payments | `/payments`, `/orders/:id/payments` | `PAYMENTS` | [payments/payments.md](payments/payments.md) |
| Payment Tracker | `/payment-tracker` | `PAYMENTS` | [payment-tracker/payment-tracker.md](payment-tracker/payment-tracker.md) |
| Invoices | `/invoices` | `PAYMENTS` | [invoices/invoices.md](invoices/invoices.md) |

### Execution

| Module | Mount | RBAC module | Document |
| --- | --- | --- | --- |
| Task Plan | `/task-plan`, `/orders/:id/task-plan` | `PLANNING` | [task-plan/task-plan.md](task-plan/task-plan.md) |
| Tasks (checklist) | `/tasks`, `/orders/:id/tasks` | `PLANNING` | [tasks/tasks.md](tasks/tasks.md) |
| Documents | `/documents`, `/orders/:id/documents` | `ORDERS` | [documents/documents.md](documents/documents.md) |
| Calendar | `/calendar` | `CALENDAR` | [calendar/calendar.md](calendar/calendar.md) |

### Rent

| Module | Mount | RBAC module | Document |
| --- | --- | --- | --- |
| Rental Persons | `/rent/persons` | `RENT` | [rent-persons/rent-persons.md](rent-persons/rent-persons.md) |
| Rental Items | `/rent/items` | `RENT` | [rent-items/rent-items.md](rent-items/rent-items.md) |
| Stock Outs | `/rent/stock-outs` | `RENT` | [rent-stock-outs/rent-stock-outs.md](rent-stock-outs/rent-stock-outs.md) |
| Returns | `/rent/returns` | `RENT` | [rent-returns/rent-returns.md](rent-returns/rent-returns.md) |
| Rent Payments | `/rent/payments` | `RENT` | [rent-payments/rent-payments.md](rent-payments/rent-payments.md) |
| Rent Dashboard | `/rent/dashboard` | `RENT` | [rent-dashboard/rent-dashboard.md](rent-dashboard/rent-dashboard.md) |
| Rent Reports | `/rent/reports` | `RENT` | [rent-reports/rent-reports.md](rent-reports/rent-reports.md) |

### Reporting

| Module | Mount | RBAC module | Document |
| --- | --- | --- | --- |
| Reports | `/reports` | `REPORTS` | [reports/reports.md](reports/reports.md) |

---

## Workflow at a glance

```
Enquiry ──(status = ORDER_CONFIRMED)──> Customer materialised
   │                                         │
   ├── Quotation (revisions, approve) ───────┤
   │                                         v
   └────────────────> Order ──> Payment Tracker ──> Payments ──> Invoice
                        │
                        ├── Task Plan (groups / items / photos)
                        ├── Order Tasks (checklist)
                        ├── Documents
                        └── Calendar (event date)

Rent is standalone:
Rental Person + Rental Item ──> Stock Out ──> Return(s) + Rent Payment(s)
```

## RBAC module list

`DASHBOARD`, `ENQUIRIES`, `QUOTATIONS`, `ORDERS`, `PLANNING`, `PAYMENTS`, `CUSTOMERS`,
`CALENDAR`, `RENT`, `REPORTS`, `MASTERS`, `SETTINGS` — defined in
`server/src/modules/permissions/catalog.ts`, which is the single source of truth for which
`(module, action)` grants exist.
