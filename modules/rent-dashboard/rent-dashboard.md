# Rent — Dashboard

## Purpose

The rent landing screen: return and payment counters, the latest transactions, and two "needs
attention" panels — what is still out, and what is still owed.

## Source Files

```
server/src/modules/rent-dashboard/
  controller.ts   routes.ts   service.ts
```

No repository, no validation and no table of its own — the route takes no parameters, and the whole
response is composed from the modules that own each figure.

## Data

None. Reads through `rent-stock-outs`, `rent-returns` and `rent-payments` repositories.

### Response shape

```
returns:          return summary totals + totalPendingQuantity
payments:         payment summary totals
recentStockOuts:  5 most recent stock outs
pendingReturns:   5 stock outs still NOT_RETURNED or PARTIAL_RETURNED
pendingPayments:  5 stock outs still UNPAID or PARTIALLY_PAID
```

## API

Base path `/api/v1/rent/dashboard`.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `RENT.canView` | The whole dashboard in one request. |

## Business Rules

- **Every figure is composed from the module that owns it** rather than re-queried here, so a
  counter on this page can never disagree with the same counter on the module's own screen.
- Each panel shows **5 rows**. The panels are a prompt to act, not a report — the full lists live in
  [Rent Reports](../rent-reports/rent-reports.md).
- **Pending returns** sort by soonest expected return date first: the ones already due, or due next,
  are the ones to chase. Nulls sort last under MySQL `asc`, which is the wanted order — a stock out
  with no promised date is not overdue.
- **Pending payments** sort oldest first. Largest outstanding balance is not a sortable column
  (balance is `grandTotal − paidAmount`, not a stored field), so the oldest unsettled transactions
  lead instead.
- `totalPendingQuantity` is `totalIssued − totalReturned`, rounded to two decimals.
- All five queries run in parallel.

## Frontend

- `client/src/pages/rent/RentDashboardPage.tsx`
- `client/src/services/rentService.ts`

## Related Modules

[Stock Outs](../rent-stock-outs/rent-stock-outs.md) · [Returns](../rent-returns/rent-returns.md) ·
[Rent Payments](../rent-payments/rent-payments.md) ·
[Rent Reports](../rent-reports/rent-reports.md)
