# Rent — Stock Outs

## Purpose

The rent transaction itself: stock handed to a rental person, line by line, at an agreed rate, with
a discount, additional charges and an optional advance. Everything else in the rent module — returns
and collections — hangs off a stock out.

## Source Files

```
server/src/modules/rent-stock-outs/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
  status.ts       rent's money and quantity arithmetic, and both derived statuses
```

## Data

| Table | Columns |
| --- | --- |
| `stock_outs` | `rent_no` (`RENT-OUT-YYYY-NNNNN`, unique), `rental_person_id`, `stock_out_date`, `expected_return_date`, `subtotal`, `discount_percent`, `discount`, `additional_charges`, `grand_total`, `paid_amount`, `issued_quantity`, `returned_quantity`, `return_status`, `payment_status`, `notes`, `status` (`ACTIVE` / `CANCELLED`), `created_by_id`, timestamps, `deleted_at`. |
| `stock_out_items` | `stock_out_id`, `rental_item_id` (nullable), `item_name_snapshot`, `quantity`, `rate`, `amount`, `returned_quantity`, `sort_order`. |

Indexed on `(company_id, stock_out_date)`, `rental_person_id`, `return_status`, `payment_status`
and `expected_return_date`.

### Derived columns

`paid_amount`, `issued_quantity`, `returned_quantity`, `return_status` and `payment_status` are
**caches, not user input**. They are stored because the stock out and return lists filter and sort
on them across a paginated result set, which a per-row aggregate cannot do. Every writer recomputes
them from the child rows inside the same transaction that changes those rows.

### Arithmetic

```
Amount      = Quantity × Rate
Subtotal    = Σ Amount
Discount    = Subtotal × DiscountPercent%
Grand Total = Subtotal − Discount + Additional Charges
```

The discount applies to the **subtotal only**: additional charges are a pass-through cost
(transport, labour), so discounting them would quietly hand back money on someone else's bill.
Everything is computed server-side from quantity and rate alone — the amounts the browser shows are
a convenience, never the figures that get stored.

### Derived statuses

```
Return:   balance = issued − returned;   ≤ 0 → RETURNED;   returned > 0 → PARTIAL_RETURNED;   else NOT_RETURNED
Payment:  balance = grandTotal − paid;   ≤ 0 → PAID;       paid > 0     → PARTIALLY_PAID;     else UNPAID
```

Both use a 0.005 tolerance for "is the balance zero" — anything smaller is float noise from summing
many rows, not a real outstanding balance. Neither may be set by hand.

## API

Base path `/api/v1/rent/stock-outs`. All routes require authentication and use the **`RENT`**
permission module.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `RENT.canView` | Paginated list. Filters: `search`, `rentalPersonId`, `returnStatus`, `paymentStatus`, `status`, `dateFrom/To`. |
| `GET` | `/:id` | `RENT.canView` | One stock out with lines, returns and payments. |
| `POST` | `/` | `RENT.canCreate` | Create, optionally with an advance. |
| `PUT` | `/:id` | `RENT.canEdit` | Edit under the rules below. |
| `PATCH` | `/:id/cancel` | `RENT.canDelete` | `{ reason? }` — retire without destroying history. |
| `DELETE` | `/:id` | `RENT.canDelete` | Soft delete, only when there is no history at all. |
| `POST` | `/:id/returns` | `RENT.canCreate` | Book a return — see [Returns](../rent-returns/rent-returns.md). |

Cancelling answers to `canDelete` rather than `canEdit`: it retires a transaction that cannot be
deleted because it carries history.

### Create payload

```
rentalPersonId                                   required
items: [{ rentalItemId?, itemName, quantity > 0, rate ≥ 0, sortOrder? }]   min 1
stockOutDate?, expectedReturnDate?, notes?
discountPercent?    0–100
additionalCharges?  ≥ 0
initialPayment?     { amount > 0, paymentMode, paymentDate?, referenceNo?, notes? }
```

`initialPayment` is offered **on create only**. Once the transaction exists, further money is
collected through the Payments module or alongside a return, so there is exactly one way to add a
second receipt.

The rental person is deliberately **absent from the update payload**: moving a saved stock out to a
different person would orphan its payments, which are written against both records.

## Business Rules

### Create

- Each line's name is snapshotted off the rental item master where one is linked, so the stored line
  describes the item as it was known at issue time rather than trusting whatever the browser posted.
  Lines with no master item keep the typed name.
- The rent number and, when an advance is being taken, the payment number are allocated **outside**
  the transaction — the sequence upsert is atomic on its own, and holding the counter inside a
  longer transaction would serialise every concurrent stock out behind it. The payment number is
  drawn only when money is actually taken, so a stock out saved without one burns no receipt number.
- The advance lands in the **same transaction** as the stock out it pays for: a stock out that
  recorded money it never received, or a receipt against a transaction that was rolled back, would
  both be worse than the whole save failing.
- Totals are recalculated last, so the stock out lands with its paid amount and payment status
  already correct rather than needing a second pass.
- An inactive rental person cannot be selected.

### Edit

| State | What may change |
| --- | --- |
| No returns, no payments | Everything. |
| Payments recorded | Header and lines, but the **grand total may not fall below what has already been collected** — that would leave the transaction over-paid. |
| Returns recorded | **The line set is frozen** (`409`). Changing an item or quantity underneath an existing return would silently invalidate that return's balance arithmetic. The header — dates, notes, discount, charges — stays editable. |
| Cancelled | Nothing. |

Totals are recomputed even when no lines were sent, because a changed discount percentage or
additional charge moves the grand total on its own.

### Cancel vs delete

- **Cancel** takes a stock out out of circulation without destroying its history. It drops out of
  every list, dashboard count and report total, but its returns and payments stay on record and
  remain readable from its view page.
- **Delete** is refused once any return or payment exists (`409`, naming the counts and pointing at
  Cancel). Only a stock out carrying no history at all can be soft-deleted.
- A cancelled stock out cannot be edited, and no return or collection may be booked against it —
  those rows would never be read back, since a cancelled transaction is excluded from every total.

### recalculate()

The single writer of every derived column. Called by every path that can change the children — the
stock out's own create and update, a return, and a payment create, update or delete — always inside
that caller's transaction, so the cached figures can never disagree with the rows they summarise.
It is **idempotent by construction**: it derives everything from scratch rather than applying a
delta, so running it twice, or after a partially applied edit, still lands on the correct value.

## Frontend

- `client/src/pages/rent/StockOutListPage.tsx`, `StockOutFormPage.tsx`, `StockOutDetailPage.tsx`,
  `StockOutPrintPage.tsx`
- `StockOutItemsEditor.tsx`, `StockReturnDialog.tsx`, `InlinePaymentFields.tsx`
- `client/src/services/rentService.ts`

## Related Modules

[Rental Persons](../rent-persons/rent-persons.md) · [Rental Items](../rent-items/rent-items.md) ·
[Returns](../rent-returns/rent-returns.md) · [Rent Payments](../rent-payments/rent-payments.md) ·
[Rent Dashboard](../rent-dashboard/rent-dashboard.md) ·
[Rent Reports](../rent-reports/rent-reports.md)
