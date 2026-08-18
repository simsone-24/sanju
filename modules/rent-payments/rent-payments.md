# Rent — Payments

## Purpose

Collections against a stock out. Deliberately separate from the Orders `payments` table: the two
workflows never mix, and a rent payment answers to a stock out, not an order.

## Source Files

```
server/src/modules/rent-payments/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
  inline.ts       shared writer used by the stock out's advance and a return's collection
```

## Data

| Table | Columns |
| --- | --- |
| `rent_payments` | `payment_no` (`RENT-PAY-YYYY-NNNNN`, unique), `company_id`, `stock_out_id`, `rental_person_id`, `payment_date`, `amount`, `payment_mode`, `reference_no`, `notes`, `received_by_id`, timestamps, `deleted_at`. |

Indexed on `stock_out_id`, `rental_person_id` and `(company_id, payment_date)`.

`rental_person_id` is stored **as well as** reachable through the stock out: the person-wise
outstanding report groups payments by person directly, and the service checks the two agree before
writing.

`RentPaymentMode`: `CASH`, `UPI`, `BANK_TRANSFER`, `CARD`, `OTHER` — its own enum, not the Orders
`PaymentMethod`.

## API

Base path `/api/v1/rent/payments`. All routes require authentication and use the **`RENT`**
permission module.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `RENT.canView` | Paginated list. Filters: `search`, `stockOutId`, `rentalPersonId`, `paymentMode`, `dateFrom/To`. |
| `GET` | `/summary` | `RENT.canView` | Collection totals. |
| `GET` | `/:id` | `RENT.canView` | One receipt. |
| `POST` | `/` | `RENT.canCreate` | `{ stockOutId, rentalPersonId, amount > 0, paymentMode, paymentDate?, referenceNo?, notes? }` |
| `PUT` | `/:id` | `RENT.canEdit` | `{ paymentDate?, amount?, paymentMode?, referenceNo?, notes? }` |
| `DELETE` | `/:id` | `RENT.canDelete` | Soft delete. |

`/summary` is registered before `/:id`.

## Business Rules

- **The payment must belong to the selected stock out *and* the selected person.** A mismatch is
  refused with a field-level error.
- The stock out and the person a payment was collected against are **fixed once written** — moving a
  receipt to a different transaction would rewrite two balance histories at once. A misfiled payment
  is corrected by deleting it and entering it against the right stock out.
- A collection may not exceed the outstanding balance. On an **edit**, the check is measured against
  the balance as it stands *without* this payment, so raising a receipt from 500 to 800 is checked
  against the room 800 needs, not against what is left after the 500.
- No collection may be booked against a cancelled stock out.
- Every write — create, update and delete — runs `recalculate()` on the parent stock out **inside
  the same transaction**, so `paid_amount` and `payment_status` can never disagree with the receipts.
- Payment numbers are drawn outside the transaction, from the atomic sequence counter.
- Deletes are soft, so a reversed receipt stays auditable.

### Three ways money arrives

| Path | Written by |
| --- | --- |
| Advance at issue time | [Stock Outs](../rent-stock-outs/rent-stock-outs.md) create, via `inline.ts` |
| Collection at handover | [Returns](../rent-returns/rent-returns.md) create, via `inline.ts` |
| Standalone collection | This module's `POST /rent/payments` |

All three write the same `rent_payments` row and run the same recalculation.

## Frontend

- `client/src/pages/rent/RentPaymentListPage.tsx`, `RentPaymentDialog.tsx`
- `client/src/pages/rent/InlinePaymentFields.tsx`
- `client/src/services/rentService.ts`

## Related Modules

[Stock Outs](../rent-stock-outs/rent-stock-outs.md) · [Returns](../rent-returns/rent-returns.md) ·
[Rental Persons](../rent-persons/rent-persons.md) ·
[Rent Reports](../rent-reports/rent-reports.md)
