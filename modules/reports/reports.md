# Reports

## Purpose

The four business reports: revenue, outstanding, customers and events. Read-only aggregations over
orders, payments and customers.

Rent has its own reports gated on the `RENT` permission — see
[Rent Reports](../rent-reports/rent-reports.md).

## Source Files

```
server/src/modules/reports/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

No table of its own. Reads `orders`, `payments`, `customers`, `enquiries` and `event_types`.

## API

Base path `/api/v1/reports`. All routes require authentication and `REPORTS.canView`.

| Method | Path | Query | Description |
| --- | --- | --- | --- |
| `GET` | `/revenue` | `page`, `limit`, `dateFrom`, `dateTo`, `eventTypeId` | Revenue collected and expected. |
| `GET` | `/outstanding` | `page`, `limit`, `dateFrom`, `dateTo`, `eventTypeId`, `customerId` | What is still owed. |
| `GET` | `/customers` | `page`, `limit`, `city` | Customer directory with event counts and outstanding. |
| `GET` | `/events` | `page`, `limit`, `dateFrom`, `dateTo`, `eventTypeId`, `status` | Events by type and status. |

## Business Rules

- **Revenue uses two deliberately different lenses:**
  - *Total revenue* is **payment-date based** — money that actually came in during the window.
  - The reconciling view is **event-date based**: expected = collected + pending for the events in
    the window.
- The Customer Report **reuses the Customers module's own `list()` wholesale**. That already
  computes `totalEvents`, `lastEvent` and `outstandingAmount` per customer, which is exactly what
  the report needs — no aggregation logic is duplicated.
- All four reports are paginated and filtered server side.

## Frontend

- `client/src/pages/reports/ReportsPage.tsx`
- Tabs: `RevenueReportTab`, `OutstandingReportTab`, `CustomerReportTab`, `EventReportTab`
- `ReportFilterBar.tsx`, `ReportPanel.tsx`, `BreakdownBarList.tsx`
- `client/src/services/reportService.ts`

## Related Modules

[Orders](../orders/orders.md) · [Payments](../payments/payments.md) ·
[Customers](../customers/customers.md) · [Rent Reports](../rent-reports/rent-reports.md)
