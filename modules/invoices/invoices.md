# Invoices

## Purpose

The tax invoice raised against an order — the billing face of the money the Payment Tracker shows.
Available as JSON for the on-screen invoice and as a rendered PDF for printing.

## Source Files

```
server/src/modules/invoices/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts
  pdf.ts          PDF renderer
```

No `validation.ts` — both routes are reads parameterised only by the order id.

## Data

| Table | Columns |
| --- | --- |
| `invoices` | `company_id`, `order_id` (unique), `invoice_number` (`INV-YYYY-NNNNN`, unique), `invoice_date`, `issued_by_id`, timestamps, `deleted_at`. |

**Only the number and the issue date are stored.** They must never move once the document has been
handed to a customer. Everything else the invoice prints — line items, tax, payments, balance — is
read live from the order and its approved quotation rather than copied here.

## API

Base path `/api/v1/invoices`. All routes require authentication and **both** `PAYMENTS.canView`
*and* `PAYMENTS.canPrint`: the invoice is the billing face of the same money the Payment Tracker
shows, so a group that cannot see payments must not reach it here either.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/order/:orderId` | The invoice as JSON, issuing its number on first request. |
| `GET` | `/order/:orderId/pdf` | The rendered PDF, regenerated from live figures on every call. |

## Business Rules

- **The number is allocated on first view and reused forever after.** A tax document that renumbered
  or re-dated itself on every reprint would be worthless. That is why a `GET` is allowed to allocate:
  the call is idempotent from the second request on, and no separate "issue invoice" step is imposed
  on the user.
- **Race handling:** two people opening the invoice at the same moment both reach the create.
  `order_id` is unique, so the loser reads the winner's row instead of failing — the number it drew
  is simply not used.
- **Nothing is cached on the PDF path.** Unlike a quotation's PDF, paid/balance and the receipts
  list can change after the invoice is first opened, so every download re-renders from the live
  figures.
- An order raised from an enquiry confirmed **without a quotation** has no line items to itemise. The
  invoice then bills the order's own total as a single adjustment line, and everything the quotation
  would have contributed reads as zero.
- Decimal arithmetic on floats can leave a trailing residue that would print as a stray line, so the
  adjustment line is thresholded rather than compared to exact zero.
- Requires a configured company (`404 Company details are not configured.`).

## Frontend

- `client/src/pages/payment-tracker/InvoicePage.tsx`
- `client/src/services/invoiceService.ts`

## Related Modules

[Payment Tracker](../payment-tracker/payment-tracker.md) · [Payments](../payments/payments.md) ·
[Orders](../orders/orders.md) · [Settings](../settings/settings.md)
