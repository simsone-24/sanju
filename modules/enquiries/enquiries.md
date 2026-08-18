# Enquiries

## Purpose

The head of the sales pipeline. An enquiry captures who asked, what event they want, when and where,
what it might cost, who is handling it, and how the conversation is progressing. Confirming an
enquiry is what materialises the customer and raises the order.

## Source Files

```
server/src/modules/enquiries/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

| Table | Role |
| --- | --- |
| `enquiries` | The enquiry itself, including the prospect block and the appointment block. |
| `enquiry_followups` | Follow-ups that have already happened — multiple per enquiry. |

### Key columns

| Group | Columns |
| --- | --- |
| Identity | `enquiry_number` (`ENQ-YYYY-NNNNN`, unique), `company_id`, `status` |
| Customer | `customer_id` (nullable until confirmed), `prospect_name`, `prospect_mobile`, `prospect_whatsapp`, `prospect_email`, `prospect_address`, `prospect_city` |
| Event | `event_type_id`, `event_name`, `event_date`, `event_time` (`MORNING` / `EVENING`), `mahal`, `venue`, `notes` |
| Appointment | `appointment_date`, `appointment_time`, `meeting_location`, `appointment_notes`, `appointment_status` |
| Money | `estimated_budget`, `quotation_amount`, `quotation_version` (cached from the latest quotation), `final_budget_amount`, `advance_amount` |
| Workflow | `assigned_user_id`, `follow_up_date` (indexed — the follow-up still owed) |

Indexed on `event_date`, `status` and `follow_up_date`. Soft delete via `deleted_at`.

### Status lifecycle

```
PENDING → APPOINTMENT_FIXED → QUOTATION_TO_SHARE → QUOTATION_SHARED → ORDER_CONFIRMED
                                                                    ↘ ORDER_LOST
```

`ORDER_LOST` is the terminal lost bucket and is reachable from any non-terminal status.
`AppointmentStatus` is tracked separately: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.

## API

Base path `/api/v1/enquiries`. All routes require authentication.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `ENQUIRIES.canView` | Paginated list. Filters: `search`, `status`, `statusGroup`, `appointmentStatus`, `eventTypeId`, `assignedUserId`, `customerId`, `eventDateFrom/To`, `appointmentDateFrom/To`. |
| `GET` | `/stats` | `ENQUIRIES.canView` | Dashboard counters. |
| `GET` | `/:id` | `ENQUIRIES.canView` | One enquiry with its normalised customer block. |
| `GET` | `/:id/timeline` | `ENQUIRIES.canView` | Full history, including the activity of the quotations and the order descended from it. |
| `POST` | `/` | `ENQUIRIES.canCreate` (+ `canConvertToOrder` when created at `ORDER_CONFIRMED`) | Create. |
| `PUT` | `/:id` | `ENQUIRIES.canEdit` (+ `canAssign` when the assignee changes) | Partial update. |
| `PATCH` | `/:id/status` | `ENQUIRIES.canChangeStatus` (+ `canConvertToOrder` for `ORDER_CONFIRMED`) | `{ status, remarks? }` |
| `DELETE` | `/:id` | `ENQUIRIES.canDelete` | Cascading soft delete. |
| `POST` | `/:id/follow-ups` | `ENQUIRIES.canCreate` | `{ followUpDate, notes?, outcome? }` |

### Create payload

```
customer: { type: 'NEW',      customerName, mobile, whatsapp?, email?, address?, city? }
        | { type: 'EXISTING', customerId }
eventTypeId, eventDate                       required
eventName?, eventTime?, mahal?, venue?, notes?
estimatedBudget?, finalBudgetAmount?, advanceAmount?
appointmentDate?, appointmentTime?, meetingLocation?, appointmentNotes?, appointmentStatus?
assignedUserId?, followUpDate?, status?
```

`mobile` must match `^[6-9]\d{9}$`.

## Business Rules

### Customer materialisation

- An **EXISTING** customer is linked immediately by id.
- A **NEW** customer is *not* written as a `customers` row yet — the details stay in the
  `prospect_*` columns until the enquiry reaches `ORDER_CONFIRMED`.
- At `ORDER_CONFIRMED` the prospect is materialised into a `Customer` **in the same transaction as
  the status flip**. If a customer with the same mobile already exists, that one is linked instead
  of creating a duplicate.
- Prospect fields are editable only while no customer is linked. Once linked, the enquiry's customer
  is the immutable Customer Master record and those fields in the payload are ignored.
- An enquiry with no customer details at all cannot be confirmed
  (`400 This enquiry has no customer details to confirm.`).

### Status

- An enquiry may be **created directly at any of the six statuses** — logging one that is already
  past first contact, or booking a confirmed order in a single step.
- There is no current-status check on transitions: callers may move an enquiry to any status
  regardless of where it currently sits.
- Creating a quotation does **not** change the enquiry's status. The two lifecycles are independent;
  the user moves the enquiry on when they decide to, not as a side effect of raising a document.

### Conversion to order

- Reaching `ORDER_CONFIRMED` — whether by status change or by creating the enquiry directly at that
  status — automatically raises the order, so no separate manual "Create Order" step is needed.
- Conversion is **best-effort**: it never lets a missing quotation or event date fail the status
  change itself. Failures are logged rather than swallowed.
- The `canConvertToOrder` permission therefore guards both the status change into `ORDER_CONFIRMED`
  and creating an enquiry already at that status.

### Assignment

`canAssign` is a permission of its own, but the assignee travels inside the ordinary update payload.
Whether it is actually *changing* can only be told by comparing against the stored value, so that
check lives in the service rather than in route middleware. Someone with Edit but not Assign can
still edit an already-assigned enquiry — they just cannot hand it to someone else.

### Money

Correcting the Final Budget or the Advance after the enquiry was confirmed reaches through to the
order and its Payment Tracker rather than sitting only on the enquiry
(`ordersService.syncOrderFromEnquiry`). It no-ops when there is no order yet.

### Deletion

`DELETE /:id` takes the whole chain with it — the enquiry's quotations, the order it became, and
that order's payments, invoice, payment tracker, task plan and documents. All soft deletes, so the
records stay auditable and the activity log continues to resolve. There is deliberately no "still
referenced" guard: the cascade is what makes the delete safe, since nothing is left pointing at a
hidden parent. The counts of what went with it are written into the log line.

## Frontend

- `client/src/pages/enquiries/EnquiryListPage.tsx`, `EnquiryFormPage.tsx`, `EnquiryDetailPage.tsx`
- `EnquiryStatusDialog.tsx`, `EnquiryAppointmentDialog.tsx`, `EnquiryQuotationDialog.tsx`,
  `EnquiryQuotationActions.tsx`, `CustomerEditDialog.tsx`
- `EnquiryProgressTracker.tsx`, `EnquirySummaryCard.tsx`, `EnquiryTimelineCard.tsx`,
  `EnquiryCustomerDetailsCard.tsx`
- `client/src/services/enquiryService.ts`

## Related Modules

[Customers](../customers/customers.md) · [Quotations](../quotations/quotations.md) ·
[Orders](../orders/orders.md) · [Event Types](../event-types/event-types.md)
