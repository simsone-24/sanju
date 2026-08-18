# Documents

## Purpose

File attachments on an order — contracts, receipts, agreements, event photos and anything else the
job accumulates. Backs the Order Details → Documents tab.

## Source Files

```
server/src/modules/documents/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
server/src/middleware/upload.ts   (document uploader)
```

Two routers: a top-level `/documents` for download and delete, and an `orderDocumentsRouter` mounted
by Orders at `/orders/:id/documents`.

## Data

| Table | Columns |
| --- | --- |
| `order_documents` | `order_id`, `document_type`, `file_name`, `file_path`, `uploaded_by_id`, `uploaded_at`, `deleted_at`. |

`DocumentType`: `QUOTATION_PDF`, `RECEIPT`, `AGREEMENT`, `EVENT_PHOTO`, `OTHER`.

## API

All routes require authentication. Documents is a **sub-resource of Orders**, not a top-level RBAC
module, so it is gated by `ORDERS` rather than introducing another permission row.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/orders/:id/documents` | `ORDERS.canView` | The order's documents. |
| `POST` | `/orders/:id/documents` | `ORDERS.canEdit` | `multipart/form-data`, field `file` + `documentType`. Max **10 MB**. |
| `GET` | `/documents/:id/file` | `ORDERS.canView` | Streams the file. |
| `DELETE` | `/documents/:id` | `ORDERS.canEdit` | Soft delete. |

## Business Rules

- **Order documents are never statically served.** Contracts, customer files and receipts can carry
  private business data and PII, so they are reachable only through the authenticated,
  company-scoped `GET /documents/:id/file` route — unlike the company logo and quotation sample
  images, which are deliberately public under `/uploads`.
- Upload size is capped at 10 MB and the uploader restricts accepted types.
- `documentType` is validated after the file is parsed, so the multipart body is available to the
  Zod schema.
- Deletes are soft, keeping the record auditable.

## Frontend

- `client/src/pages/orders/tabs/OrderDocumentsTab.tsx`
- `client/src/services/documentService.ts`

## Related Modules

[Orders](../orders/orders.md)
