# Quotations

## Purpose

Itemised priced documents. A quotation can be raised from an enquiry, an existing customer, an
existing order, or stand alone as a manual quotation for someone contacted by phone or WhatsApp.
Approving an enquiry-sourced quotation is what sets the enquiry's final budget and lifts the total
of the order raised from it.

## Source Files

```
server/src/modules/quotations/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
  pdf.ts          PDF renderer (letterhead, line items, tax block, image gallery)
```

## Data

| Table | Role |
| --- | --- |
| `quotations` | The document header: source, links, money, status, version, `pdf_path`. |
| `quotation_items` | Line items — quotations are itemised, never a lump sum. |
| `quotation_images` | Sample decor photos rendered as a gallery page on the PDF. |

### Sources

| `source` | Link column | Notes |
| --- | --- | --- |
| `ENQUIRY` | `enquiry_id` | The only source that feeds the order workflow. Versioned. |
| `CUSTOMER` | `customer_id` | Standalone, always version 1. |
| `ORDER` | `order_id` | Standalone, always version 1. |
| `MANUAL` | none | Customer captured in the `manual_*` snapshot columns; WhatsApp number required. |

`company_id` is stored directly rather than derived through the link, so a manual quotation with no
parent record is still company-scoped in every query.

### Status

`DRAFT`, `SENT`, `APPROVED`, `REJECTED`, `REVISED`

`REVISED` means "a newer version has superseded this one" and is written by `create()` when a new
revision is raised — it cannot be chosen on the create form.

### Money

```
subtotal   = Σ (quantity × rate)
discounted = subtotal − discount
tax        = discounted × cgstPercent% + discounted × sgstPercent%   (computed independently, stored as the sum)
total      = discounted + tax                                        (may never be negative)
```

`@@unique([enquiryId, version])` prevents duplicate revisions. MySQL treats a `NULL` enquiry id as
distinct, so non-enquiry quotations are unaffected.

## API

Base path `/api/v1/quotations`. All routes require authentication.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | `QUOTATIONS.canView` | Flat paginated list. Filters: `search`, `source`, `status`, `enquiryId`, `customerId`, `orderId`, `assignedUserId`, `dateFrom/To` (on `quotation_date`). |
| `GET` | `/grouped` | `QUOTATIONS.canView` | The module's default view — one row per enquiry (its latest revision) plus a row per customer/order/manual quotation. |
| `GET` | `/stats` | `QUOTATIONS.canView` | Dashboard counters. |
| `GET` | `/branding` | `QUOTATIONS.canView` | Company letterhead + banking block for the live preview and PDF. |
| `GET` | `/:id` | `QUOTATIONS.canView` | The document, its sibling revisions, whether it has become an order, and the standing terms — one request instead of four. |
| `GET` | `/:id/timeline` | `QUOTATIONS.canView` | Activity trail. |
| `GET` | `/:id/pdf` | `QUOTATIONS.canPrint` | Downloads the rendered PDF. |
| `POST` | `/` | `QUOTATIONS.canCreate` (+ `canApprove` when saved as `APPROVED`) | Create or raise a revision. |
| `PUT` | `/:id` | `QUOTATIONS.canEdit` (+ `canApprove` when saved as `APPROVED`) | Edit. |
| `PATCH` | `/:id/status` | `QUOTATIONS.canEdit` | `{ status: 'SENT' \| 'REJECTED', remarks? }` |
| `PATCH` | `/:id/approve` | `QUOTATIONS.canApprove` | Approve / confirm. |
| `POST` | `/:id/images` | `QUOTATIONS.canEdit` | `multipart/form-data`, field `images`, up to **12** files, JPEG/PNG, max **5 MB** each. |
| `DELETE` | `/:id/images/:imageId` | `QUOTATIONS.canEdit` | Remove one image. |

`/grouped`, `/stats` and `/branding` are registered before `/:id` so the literals are not captured
as ids.

### Create payload

```
source: 'ENQUIRY' | 'CUSTOMER' | 'ORDER' | 'MANUAL'
enquiryId | customerId | orderId | manualCustomer   — required per source
status?: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED'
quotationDate?, discount?, cgstPercent?, sgstPercent?, remarks?
items: [{ itemName, description?, quantity > 0, unit?, rate ≥ 0, sortOrder? }]   min 1
```

## Business Rules

- **Source integrity.** The required link column depends on the source and is enforced before the
  request reaches the service; a mismatched payload is rejected.
- **No creation limits.** Unlimited quotations per enquiry, with no rule blocking creation after one
  has been sent, approved, or after the enquiry itself has been confirmed or lost. The enquiry is
  the parent record and never restricts its children.
- **No status-based edit lock.** A quotation stays editable at every stage — sent, revised, rejected
  or approved.
- **The one edit guard protects banked money**, not the workflow: an approved quotation may already
  have become an order whose stored totals are copies of this quotation's total, so editing is
  refused when that order is `ORDER_CLOSED` (only reachable at a zero balance — re-opening the
  amount would leave a closed order owing money) or `REJECTED`.
- **Approval is never a plain column write** for an enquiry-sourced quotation. `approve()` also
  re-sums the enquiry's final budget and lifts the total of any order already raised from it, so the
  form's status dropdown routes through exactly the same action the Confirm button uses. Neither
  path touches the enquiry's own status. For customer/order/manual quotations `APPROVED` is just a
  label.
- `final_budget_amount` on the enquiry is the **combined total of every approved quotation**, so
  editing one of them re-sums rather than overwriting with that one's total.
- **Revisions.** Only enquiry-sourced quotations are versioned; every other source is a standalone
  v1 with a fresh number. Raising a revision marks the previous version `REVISED`.
- **Confirmation for conversion** is refused for non-enquiry quotations
  (`400 Only an enquiry-based quotation can be confirmed for conversion to an order.`).
- Customer details may only be edited on a `MANUAL` quotation — every other source reads its
  recipient from the linked record.
- Total may not go negative (`400 Total amount cannot be negative. Check the discount amount.`).
- **PDF rendering is isolated** so a PDF failure never rolls back a successfully-saved quotation; the
  download route regenerates on demand.
- The grouped list is stitched from two different queries and paginated in memory — the only way to
  page a set assembled from an enquiry-grouped view and standalone rows, and cheap at company-scale
  volume.

## Frontend

- `client/src/pages/quotations/QuotationListPage.tsx`, `QuotationFormPage.tsx`,
  `QuotationDetailPage.tsx`
- `QuotationItemsEditor.tsx`, `QuotationPreview.tsx`, `QuotationPreviewDialog.tsx`,
  `QuotationActivityDrawer.tsx`
- `client/src/pages/enquiries/EnquiryQuotationDialog.tsx`, `EnquiryQuotationActions.tsx`
- `client/src/services/quotationService.ts`

## Related Modules

[Enquiries](../enquiries/enquiries.md) · [Orders](../orders/orders.md) ·
[Settings](../settings/settings.md) (letterhead, banking, terms)
