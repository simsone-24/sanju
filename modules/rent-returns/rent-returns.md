# Rent — Returns

## Purpose

Books stock coming back against the stock out that issued it, optionally collecting money at the
same time — handover is when a rental is most often actually paid off.

## Source Files

```
server/src/modules/rent-returns/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

| Table | Columns |
| --- | --- |
| `stock_returns` | `return_no` (`RENT-RET-YYYY-NNNNN`, unique), `company_id`, `stock_out_id`, `return_date`, `notes`, `created_by_id`, timestamps, `deleted_at`. |
| `stock_return_items` | `stock_return_id`, `stock_out_item_id`, `quantity_returned`. |

A stock out may be returned in **as many instalments as the customer brings items back**, so returns
are rows rather than a boolean, and the history is never overwritten.

## API

All routes require authentication and use the **`RENT`** permission module. Creating a return is
reached through the stock out it belongs to, so the `/rent/returns` router itself is read-only.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `POST` | `/rent/stock-outs/:id/returns` | `RENT.canCreate` | Book a return against that stock out. |
| `GET` | `/rent/returns` | `RENT.canView` | Paginated list. Filters: `search`, `stockOutId`, `rentalPersonId`, `dateFrom/To`. |
| `GET` | `/rent/returns/summary` | `RENT.canView` | Return counters. |
| `GET` | `/rent/returns/:id` | `RENT.canView` | One return with its lines. |

`/summary` is registered before `/:id`.

### Create payload

```
items: [{ stockOutItemId, quantityReturned ≥ 0 }]   min 1, at least one > 0
returnDate?, notes?
collection?: { amount > 0, paymentMode, referenceNo?, notes? }
```

## Business Rules

- **The stock out's own lines are the authority on what may come back.** For each line
  `Remaining = Issued − Previously Returned`, and a booking above that is refused with the exact
  figure that was available.
- Every check is **re-run inside the transaction against the same client that writes the rows**, so
  a return raced against another one is validated on what the database actually holds rather than on
  a snapshot read beforehand.
- A zero is a legitimate value to post: the return screen renders every line of the stock out, most
  of them with nothing to book. The whole return is rejected only when **no** line carries a
  quantity — `400 Enter a return quantity for at least one item.`
- Items must belong to the stock out being returned against
  (`400 One or more items do not belong to this stock out.`).
- The return rows and the stock out's recalculated totals land **together or not at all**. So do the
  goods coming back and the money settling them.
- The payment number is drawn only when money actually changes hands, so a plain return burns no
  receipt number.
- `recalculate()` runs once, at the end: it derives both the return status and the payment status
  from the rows just written, so running it earlier would only have to be repeated.
- No return may be booked against a cancelled stock out.

## Frontend

- `client/src/pages/rent/StockReturnPage.tsx`, `StockReturnDialog.tsx`
- `client/src/pages/rent/StockOutDetailPage.tsx`
- `client/src/services/rentService.ts`

## Related Modules

[Stock Outs](../rent-stock-outs/rent-stock-outs.md) ·
[Rent Payments](../rent-payments/rent-payments.md) ·
[Rent Reports](../rent-reports/rent-reports.md)
