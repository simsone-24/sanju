# Payments

## Purpose

Records money collected against an order. Owns the write path that every collection goes through —
whether entered on the Order's Payments tab, through the Payment Tracker's edit dialog, or seeded as
the opening advance at conversion.

## Source Files

```
server/src/modules/payments/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

The router is split in two: a top-level `/payments` router and an `orderPaymentsRouter` mounted by
Orders at `/orders/:id/payments`. The URL lives under Orders, but Payments owns the business logic.

## Data

| Table | Columns |
| --- | --- |
| `payments` | `order_id`, `payment_date`, `payment_type` (`ADVANCE` / `PARTIAL` / `FINAL`), `amount`, `payment_method` (`CASH` / `UPI` / `BANK` / `CARD` / `CHEQUE`), `reference_number`, `remarks`, `received_by_id`, `receipt_number` (`RCT-YYYY-NNNNN`, unique), `created_at`, `deleted_at`. |

Indexed on `payment_date`. Payment **status** is never stored on the payment row — it is derived
from the order's `total_amount` and `paid_amount`.

## API

All routes require authentication.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/payments/:id` | `PAYMENTS.canView` | One receipt. |
| `GET` | `/api/v1/orders/:id/payments` | `PAYMENTS.canView` | Every collection against an order. |
| `POST` | `/api/v1/orders/:id/payments` | `PAYMENTS.canCreate` | Record a collection. |

### Create payload

```
paymentType:   'ADVANCE' | 'PARTIAL' | 'FINAL'     required
amount:        > 0                                  required
paymentMethod: 'CASH' | 'UPI' | 'BANK' | 'CARD' | 'CHEQUE'   required
paymentDate?, referenceNumber?, remarks?
```

## Business Rules

- **A payment may never exceed the total order amount.** Every rule that can reject a collection
  lives in `assertPaymentAllowed`, checked before anything is written. It is exported so a caller
  composing a larger transaction — the Payment Tracker's edit, which may also change the budget in
  the same request — can validate up front and never leave a half-applied edit behind. Amounts
  accept a plain number as well as a Decimal, so the tracker can validate against the budget it is
  about to write before that value has come back from the database.
- `recordPayment` writes three things against the caller's transaction so they land together: the
  payment row, the order's running totals, and the Payment Tracker's derived status.
- **Ordering inside the transaction matters and is deliberate:**
  - the order's amounts are updated *before* the payment row is created, because the create's
    `select` nests a fresh read of the order — otherwise the response would carry a stale
    pre-write snapshot;
  - the tracker status is derived *after* the payment row exists, because the Advance-vs-Partial
    rule counts payment rows.
- Callers must run `assertPaymentAllowed` first and allocate the receipt number **outside** the
  transaction — the sequence generator runs its own atomic write.
- `recordPayment` deliberately does **not** touch `Order.status`. An order's status tracks the event
  and work lifecycle and is owned by Orders alone; how much has been collected is carried by the
  derived payment status instead. Money moving must never advance the work.
- The advance seeded at conversion is logged through this module too, so a receipt raised
  automatically shows on the same trail as one recorded by hand.

## Frontend

- `client/src/pages/orders/tabs/OrderPaymentsTab.tsx`
- `client/src/pages/customers/tabs/CustomerPaymentsTab.tsx`
- `client/src/services/paymentService.ts`

## Related Modules

[Orders](../orders/orders.md) · [Payment Tracker](../payment-tracker/payment-tracker.md) ·
[Invoices](../invoices/invoices.md) · [Payment Methods](../payment-methods/payment-methods.md)
