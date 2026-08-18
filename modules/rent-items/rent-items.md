# Rent — Rental Items

## Purpose

The rentable catalogue: what can go out, in what category, at what default rate. The project had no
existing item or product master to reuse — a quotation line is free text on one document, not a
reusable record — so rent gets its own master rather than borrowing a table that cannot be selected
from.

## Source Files

```
server/src/modules/rent-items/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

| Table | Columns |
| --- | --- |
| `rental_items` | `company_id`, `item_name`, `category`, `default_rent_rate`, `description`, `status` (`ACTIVE` / `INACTIVE`), timestamps, `deleted_at`. |

Unique on `(company_id, item_name)`.

**Phase 1 carries no physical inventory** — no total, available or rented quantity, and no
availability check before a stock out. This is a plain catalogue so those columns can be added later
without reshaping the transaction tables.

## API

Base path `/api/v1/rent/items`. All routes require authentication and use the **`RENT`** permission
module.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `RENT.canView` | Paginated list. Filters: `search`, `status`, `category`. |
| `GET` | `/categories` | `RENT.canView` | Distinct categories, for the filter dropdown. |
| `GET` | `/:id` | `RENT.canView` | One item. |
| `POST` | `/` | `RENT.canCreate` | `{ itemName, category?, defaultRentRate?, description? }` |
| `PUT` | `/:id` | `RENT.canEdit` | Partial update, plus `status`. |
| `DELETE` | `/:id` | `RENT.canDelete` | Soft delete. |

`/categories` is registered before `/:id` so the literal is not captured as an id.

## Business Rules

- Item names are unique per company —
  `409 A rental item with this name already exists.`
- **Renaming is always allowed.** Every stock out line carries its own item-name snapshot, so past
  rental documents keep the name they were issued under.
- `default_rent_rate` seeds the rate on a new stock out line; the line's own rate is what the
  transaction actually charges.
- A stock out line may exist with no linked master item at all (a typed one-off name), and a line
  whose master row was later deleted still reads correctly from its snapshot.

## Frontend

- `client/src/pages/rent/RentalItemListPage.tsx`
- `client/src/pages/rent/StockOutItemsEditor.tsx`
- `client/src/services/rentService.ts`

## Related Modules

[Stock Outs](../rent-stock-outs/rent-stock-outs.md)
