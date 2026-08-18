# Payment Tracker

## Purpose

The money view over orders: what each event is expected to bring in, what has been collected, what
is still owed, and where each order stands. One tracker row per confirmed order, created
automatically at conversion. It is a second view over the same money the Payments module writes, not
a second ledger.

## Source Files

```
server/src/modules/payment-tracker/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

| Table | Columns |
| --- | --- |
| `payment_trackers` | `order_id` (unique), `payment_status`, `status_manual`, `remarks`, timestamps, `deleted_at`. |

The tracker holds **only what it owns**. Budget, collected and balance stay on `orders`, and the
advance is summed from the payment rows rather than stored — the receipts are the only place that
distinction lives. Indexed on `payment_status`.

### Status

`PENDING`, `ADVANCE_PAID`, `PARTIAL_PAYMENT`, `FULLY_PAID`

```
collected ≤ 0                        → PENDING
budget > 0 and collected ≥ budget    → FULLY_PAID
otherwise, no non-advance receipts   → ADVANCE_PAID
otherwise                            → PARTIAL_PAYMENT
```

Deliberately separate from the `PENDING` / `PARTIAL` / `PAID` / `OVERDUE` badge the Orders list
derives on the fly: this one is persisted because an authorized user may override it, which a purely
derived value cannot support.

### Dashboard groups

The three dashboard cards collapse the four statuses into three buckets, shared by the cards, their
click-through filter and the counts:

| Group | Statuses |
| --- | --- |
| `PENDING` | `PENDING` |
| `PARTIAL` | `ADVANCE_PAID`, `PARTIAL_PAYMENT` |
| `PAID` | `FULLY_PAID` |

## API

Base path `/api/v1/payment-tracker`. All routes require authentication and reuse the **`PAYMENTS`**
permission — a role that may not see payments must not reach the same money through this route.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `PAYMENTS.canView` | Paginated list. Filters: `search`, `customerId`, `paymentStatus`, `statusGroup`, `orderStatus`, `eventDateFrom/To`. |
| `GET` | `/stats` | `PAYMENTS.canView` | Card totals, narrowed by the same filters minus pagination. |
| `GET` | `/:orderId` | `PAYMENTS.canView` | The tracker for one order. |
| `GET` | `/:orderId/history` | `PAYMENTS.canView` | Its collection history. |
| `PUT` | `/:orderId` | `PAYMENTS.canEdit` | Budget, a collection, the status and remarks in one request. |

`/stats` is registered before `/:orderId`.

### Update payload

```
budgetAmount?  > 0
collected?     { amount > 0, paymentMethod, paymentDate?, referenceNumber? }
paymentStatus? PaymentTrackerStatus | null    (null hands the status back to Auto)
remarks?       max 2000 chars
```

At least one field is required — an empty body is rejected rather than writing an activity entry for
a no-op.

## Business Rules

- **Every rule is checked before the first write, then all writes share a single transaction**, so a
  request that changes the budget *and* records a collection can never apply one without the other.
- A collection is validated against the budget **this request is about to set**, not the stored one,
  so raising the budget and collecting against the new headroom works in a single save.
- The Collected box takes the amount just received, not a new running total, so it always becomes a
  `Payment` row of its own with its own receipt number. Receipt numbers are drawn outside the
  transaction.
- The payment **type is classified from where the order stands**, since the form asks only for an
  amount, a method and a date: the opening collection is the advance, one that clears the remaining
  balance is the final settlement, anything between is a part payment.
- Raising the budget can move a settled order back to part-paid, so the derived status follows the
  new figure even when no money moved.
- **Manual status pinning:** once someone chooses a status by hand, `status_manual` is set and
  automatic recalculation leaves it alone until it is switched back to Auto — otherwise the next
  payment would silently revert the manual choice. Status and remarks are written last in the
  transaction, because recording a collection recalculates the derived status and a status pinned in
  the same request has to survive that.
- Changes are logged **per change** rather than as one lump, so the audit trail names what actually
  moved.

## Frontend

- `client/src/pages/payment-tracker/PaymentTrackerListPage.tsx`,
  `PaymentTrackerDetailPage.tsx`, `PaymentTrackerEditDialog.tsx`, `PaymentHistoryDialog.tsx`,
  `InvoicePage.tsx`
- `client/src/services/paymentTrackerService.ts`

## Related Modules

[Payments](../payments/payments.md) · [Orders](../orders/orders.md) ·
[Invoices](../invoices/invoices.md)
