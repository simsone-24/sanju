# Orders

## Purpose

A confirmed event. Orders are the execution hub: everything downstream — payments, the payment
tracker, the invoice, the task plan, the checklist, documents and the calendar — hangs off an order.
An order comes into existence only by conversion from a confirmed enquiry.

## Source Files

```
server/src/modules/orders/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

The Orders router also mounts four sub-resources owned by other modules:
`/:id/payments`, `/:id/tasks`, `/:id/task-plan`, `/:id/documents`.

## Data

| Table | Columns |
| --- | --- |
| `orders` | `order_number` (`ORD-YYYY-NNNNN`, unique), `enquiry_id`, `quotation_id` (nullable), `customer_id`, `event_date` (nullable), `venue`, `notes`, `remarks`, `total_amount`, `paid_amount`, `pending_amount`, `coordinator_id`, `cancellation_reason`, `status`, timestamps, `deleted_at`. |

Indexed on `event_date` and `status`.

### Status

`YET_TO_START` → `IN_PROGRESS` → `ORDER_CLOSED`, plus `REJECTED`.

Four stages tracking the **event / work lifecycle only**. Payment standing is derived and lives in
the Payment Tracker; task progress lives on the task groups and items. Neither reads this field, and
money moving never advances the work.

## API

Base path `/api/v1/orders`. All routes require authentication.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `ORDERS.canView` | Paginated list. Filters: `search`, `status`, `customerId`, `eventDateFrom/To`. |
| `GET` | `/stats` | `ORDERS.canView` | Dashboard counters. |
| `GET` | `/eligible-enquiries` | `ORDERS.canCreate` **and** `ENQUIRIES.canConvertToOrder` | Confirmed enquiries not yet converted — feeds the "Create Order" picker. |
| `POST` | `/convert` | `ORDERS.canCreate` **and** `ENQUIRIES.canConvertToOrder` | `{ enquiryId, quotationId }` |
| `GET` | `/:id` | `ORDERS.canView` | One order. |
| `GET` | `/:id/timeline` | `ORDERS.canView` | Activity trail. |
| `PUT` | `/:id` | `ORDERS.canEdit` | `{ eventDate?, venue?, notes?, remarks?, coordinatorId? }` |
| `PATCH` | `/:id/status` | `canCancel` → `REJECTED`; `canCompleteEvent` → `ORDER_CLOSED`; `canEdit` → anything else | `{ status, cancellationReason?, remarks? }` |

`/stats` and `/eligible-enquiries` are registered before `/:id`.

Both conversion routes require **two** permissions, so withholding either one stops a group
converting.

## Business Rules

### Conversion

- Conversion is the only way an order is created. It happens two ways, both landing in the same code
  path: explicitly via `POST /convert`, or automatically the moment an enquiry reaches
  `ORDER_CONFIRMED` (`autoConvertFromEnquiry`).
- **Neither a quotation nor an event date is a pre-condition.** An enquiry that reaches
  `ORDER_CONFIRMED` belongs in Orders and the Payment Tracker; both can be filled in afterwards.
- **No quotation-status gate:** the automatic path prefers the enquiry's approved quotation and
  otherwise takes its latest revision whatever state it is in, and raises the order with no
  quotation at all when none exists. The enquiry's own status is the decision.
- The automatic path **never throws** — a status change must not fail because the order behind it
  could not be built. Failures are logged rather than silently discarded.
- Only enquiry-sourced quotations feed the workflow; customer/order/manual quotations have no
  enquiry link and can never be converted.
- A linked customer must exist (`ORDER_CONFIRMED` materialises it — see
  [Enquiries](../enquiries/enquiries.md)).
- A second order for the same enquiry is prevented by an existing-order guard.

### Opening amounts

Total falls back in this order: **enquiry final budget → quotation total → estimated budget → zero.**
The final budget leads because it starts as the approved quotation's total but stays editable on the
enquiry afterwards, so when the two disagree the enquiry's figure is the later, deliberate decision.
An order may legitimately open at zero and be corrected from the Order Details page.

### The conversion transaction

All of the following succeed together or not at all:

1. The order row.
2. The task checklist seeded from the default task templates — otherwise an order would exist with
   no tasks.
3. The Payment Tracker row — every confirmed order automatically has one, so it can never be
   missing for an order that exists.
4. The enquiry's advance, written as the order's opening `ADVANCE` receipt. It is real money already
   received, so it belongs in the Payment Tracker's collected total rather than as a note on the
   enquiry. It is **capped at the order's own total** — a payment may never exceed what is owed, and
   an advance larger than a budget since revised down must not fail the conversion. The enquiry form
   collects an amount only, so the method is recorded as `CASH` and can be corrected from the
   Payment Tracker.

Both the order number and the receipt number are allocated **before** the transaction opens, because
the sequence generator runs its own atomic write.

Converting does not change the enquiry's status — it is already `ORDER_CONFIRMED` and terminal.

### Status changes

- Any status may be changed to any other. Payment standing does not gate a transition.
- A **cancellation reason is mandatory** when moving to `REJECTED`.
- `ORDER_CLOSED` is only reachable at a zero balance.
- `canCancel` and `canCompleteEvent` guard those two transitions specifically; every other
  transition stays on `canEdit`.

### Staying in step with the enquiry

`syncOrderFromEnquiry` re-applies an enquiry's money to the order raised from it after the Final
Budget or Advance is edited post-confirmation — without it the two drift apart the moment an enquiry
is corrected.

## Frontend

- `client/src/pages/orders/OrderListPage.tsx`, `OrderDetailPage.tsx`
- Tabs: `OrderOverviewTab`, `OrderQuotationTab`, `OrderPaymentsTab`, `OrderTaskListTab`,
  `OrderTaskPlanTab`, `OrderDocumentsTab`, `OrderTimelineTab`
- `OrderStatusDialog.tsx`, `OrderProgressTracker.tsx`, `OrderSummaryCard.tsx`,
  `TaskPlanGroupCard.tsx`, `TaskItemPhotoDialog.tsx`
- `client/src/services/orderService.ts`

## Related Modules

[Enquiries](../enquiries/enquiries.md) · [Quotations](../quotations/quotations.md) ·
[Payments](../payments/payments.md) · [Payment Tracker](../payment-tracker/payment-tracker.md) ·
[Invoices](../invoices/invoices.md) · [Task Plan](../task-plan/task-plan.md) ·
[Tasks](../tasks/tasks.md) · [Documents](../documents/documents.md) ·
[Calendar](../calendar/calendar.md)
