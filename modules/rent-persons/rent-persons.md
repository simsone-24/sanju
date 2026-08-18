# Rent — Rental Persons

## Purpose

The people the company hands rental stock to. Their own master, deliberately separate from the
Customer master: the rent workflow has no link to enquiries, quotations or orders.

## Source Files

```
server/src/modules/rent-persons/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

| Table | Columns |
| --- | --- |
| `rental_persons` | `company_id`, `name`, `phone`, `email`, `address`, `city`, `notes`, `status` (`ACTIVE` / `INACTIVE`), timestamps, `deleted_at`. |

Indexed on `(company_id, name)` and `phone`.

## API

Base path `/api/v1/rent/persons`. All routes require authentication and use the **`RENT`**
permission module.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `RENT.canView` | Paginated list. Filters: `search`, `status`, `city`. Each row carries its own outstanding position. |
| `GET` | `/:id` | `RENT.canView` | One person with their rent history. |
| `POST` | `/` | `RENT.canCreate` | `{ name, phone, email?, address?, city?, notes? }` |
| `PUT` | `/:id` | `RENT.canEdit` | Partial update, plus `status`. |
| `DELETE` | `/:id` | `RENT.canDelete` | Soft delete — only when the person has no rent history. |

`phone` must match `^[6-9]\d{9}$` — the same rule the Customer master applies, so one number format
is validated across the whole app.

## Business Rules

- **An inactive person cannot be picked for a new transaction**, but their existing history stays
  fully accessible. The guard sits on the write path only, never on a read.
- **A person with stock outs cannot be deleted.** They are refused rather than hidden: historical
  records must stay auditable, and a deleted person would leave every one of their transactions
  pointing at a name the UI can no longer resolve. Setting `status = INACTIVE` is the supported way
  to take someone out of circulation.
- Outstanding totals on the list are aggregated for the current page in **one query** rather than
  per row.

## Frontend

- `client/src/pages/rent/RentalPersonListPage.tsx`, `RentalPersonDetailPage.tsx`
- `client/src/services/rentService.ts`

## Related Modules

[Stock Outs](../rent-stock-outs/rent-stock-outs.md) ·
[Rent Payments](../rent-payments/rent-payments.md) ·
[Rent Reports](../rent-reports/rent-reports.md)
