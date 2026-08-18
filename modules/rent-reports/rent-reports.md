# Rent — Reports

## Purpose

Rent's own five reports: what went out, what came back, what is still out, what was collected, and
where each rental person stands.

## Source Files

```
server/src/modules/rent-reports/
  controller.ts   routes.ts   service.ts   repository.ts   validation.ts
```

## Data

No table of its own. Reads `stock_outs`, `stock_out_items`, `stock_returns`, `stock_return_items`,
`rent_payments` and `rental_persons`.

## API

Base path `/api/v1/rent/reports`. All routes require authentication and `RENT.canView`.

These are gated on **`RENT`, not `REPORTS`**: they read rent data only, so a group that can see rent
can see its reports, and one that cannot must not reach them through the Reports screen either.

| Method | Path | Filters | Description |
| --- | --- | --- | --- |
| `GET` | `/stock-out` | `dateFrom`, `dateTo`, `rentalPersonId`, `rentalItemId`, `search` | Everything issued in the window. |
| `GET` | `/returns` | + `returnStatus` | Everything returned. |
| `GET` | `/pending-returns` | `dateFrom`, `dateTo`, `rentalPersonId`, `rentalItemId`, `search` | What is still out. |
| `GET` | `/payments` | `dateFrom`, `dateTo`, `rentalPersonId`, `paymentMode`, `paymentStatus`, `search` | Collections, reported per stock out. |
| `GET` | `/person-summary` | `search` | Person-wise outstanding position. |

Each report has **its own filter schema** rather than sharing one permissive one, so a filter a
report does not offer is rejected instead of quietly ignored.

## Business Rules

- **Reports render a whole filtered result set, not a page of it**, so every query is capped. Past
  the cap the response says so, instead of silently showing a partial answer the reader would take
  for the total.
- **Pending returns list what is still out, not every line of every unsettled transaction** — a
  fully returned line inside a partially returned stock out is not pending.
- The **payment report is reported per stock out**, matching its column list (Person, Stock Out,
  Total, Paid, Balance, Status); a receipt-level listing could not carry a total or a balance. The
  Payment Mode filter therefore reads as "transactions that received a payment by this mode".
- Cancelled stock outs are excluded from report totals.

## Frontend

- `client/src/pages/rent/RentReportsPage.tsx`, `RentReportFilterBar.tsx`
- `client/src/services/rentService.ts`

## Related Modules

[Stock Outs](../rent-stock-outs/rent-stock-outs.md) · [Returns](../rent-returns/rent-returns.md) ·
[Rent Payments](../rent-payments/rent-payments.md) ·
[Rent Dashboard](../rent-dashboard/rent-dashboard.md) · [Reports](../reports/reports.md)
