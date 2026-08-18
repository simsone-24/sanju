# Customers

## Purpose

The customer master and the order history behind it. Customers are never created by hand — they
come into existence through the enquiry workflow — so this module is a directory plus an edit
surface, not a full CRUD master.

## Source Files

```
server/src/modules/customers/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

| Table | Columns |
| --- | --- |
| `customers` | `customer_code` (unique, `CUS-YYYY-NNNNN`), `customer_name`, `mobile`, `whatsapp`, `email`, `address`, `city`, `remarks`, `status`, `company_id`, timestamps, `deleted_at`. |

## API

Base path `/api/v1/customers`. All routes require authentication.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `CUSTOMERS.canView` | Paginated list with search and city filter; each row carries `totalEvents`, `lastEvent` and `outstandingAmount`. |
| `GET` | `/:id` | `CUSTOMERS.canView` | One customer. |
| `GET` | `/:id/orders` | `CUSTOMERS.canView` | Order history, split into past and upcoming. |
| `PUT` | `/:id` | `CUSTOMERS.canEdit` | `{ customerName?, mobile?, whatsapp?, email?, address?, city?, remarks? }` |

There is deliberately **no create and no delete endpoint.**

## Business Rules

- **Never duplicate customer information.** A customer row is created only by the enquiry workflow
  (`customers/service.ts create()`, called internally), and only when an enquiry reaches
  `ORDER_CONFIRMED`. Until then a prospect's details live in the enquiry's own `prospect_*` columns.
- Creation accepts an optional transaction client so the caller can wrap the customer and the record
  that references it in one atomic write — otherwise a failure downstream would leave an orphaned
  customer behind.
- When an enquiry is confirmed, an existing customer is matched **by mobile number** and linked
  rather than duplicated.
- Editing is the only write here: once a customer is linked to an enquiry, correcting a typo'd name
  or an outdated phone number has nowhere else to happen, because the enquiry never copies these
  fields onto itself. Reachable from the customer profile and from the Enquiry form's Existing
  Customer step.
- `mobile` must be a valid 10-digit Indian number (`^[6-9]\d{9}$`) — the same rule the enquiry form
  and the rental person master apply.
- In the order history, an order whose event date is not set yet (confirmed before one was known)
  is neither past nor upcoming, so it appears in neither list until a date is entered.

## Frontend

- `client/src/pages/customers/CustomerListPage.tsx`
- `client/src/pages/customers/CustomerDetailPage.tsx` with tabs `CustomerProfileTab`,
  `CustomerOrdersTab`, `CustomerPaymentsTab`
- `client/src/pages/enquiries/CustomerEditDialog.tsx`
- `client/src/services/customerService.ts`

## Related Modules

[Enquiries](../enquiries/enquiries.md) · [Orders](../orders/orders.md) · [Reports](../reports/reports.md) —
the Customer Report reuses this module's `list()` wholesale rather than duplicating the aggregation.
