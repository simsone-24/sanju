# Settings

## Purpose

The company profile: identity, GST, logo, banking block, authorized signatory, footer message and
the standing terms and conditions. This is the letterhead every quotation and invoice prints from.

## Source Files

```
server/src/modules/settings/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
server/src/middleware/upload.ts   (logo uploader)
```

## Data

| Table | Columns |
| --- | --- |
| `companies` | `company_name`, `contact_person`, `mobile`, `email`, `address`, `logo`, `gst_number`, `website`, `bank_name`, `bank_account_name`, `bank_account_number`, `bank_branch`, `bank_ifsc`, `bank_upi`, `authorized_signatory`, `footer_message`, `terms_and_conditions`, `status`. |

Every banking and branding field is optional — a fresh company may not have configured banking yet,
and the PDF renderer omits any missing block.

## API

Base path `/api/v1/settings`. All routes require authentication.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/company` | `SETTINGS.canView` | The company profile. |
| `PUT` | `/company` | `SETTINGS.canEdit` | Partial update; at least one field required. |
| `POST` | `/company/logo` | `SETTINGS.canEdit` | `multipart/form-data`, field `logo`, image only, max **2 MB**. |

### Validation

- `gstNumber` must match the GSTIN format `NNAAAAANNNNANAZN`.
- `website` must be a valid URL.
- An empty update body is rejected.

## Business Rules

- Terms and conditions are held **once at company level**, not per quotation: they are the same
  commercial policy for every document, so editing them in Settings changes what the next quotation
  prints without touching existing records.
- The logo is served from the public `/uploads/company` static mount — it is meant to be displayable
  in headers and on quotation branding, unlike order documents and staff photos which stay behind
  authenticated routes.
- The letterhead and banking block are exposed to anyone who can view quotations through
  `GET /quotations/branding`, not just Settings admins, because they are part of the quotation's own
  header.

## Frontend

- `client/src/pages/masters/tabs/CompanyInfoTab.tsx`
- `client/src/services/companyService.ts`

## Related Modules

[Quotations](../quotations/quotations.md) · [Invoices](../invoices/invoices.md)
