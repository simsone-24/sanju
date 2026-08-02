
---

# Enquiry Details Page — De-duplication & Layout Redesign Plan

_Added 29 Jul 2026. Scope: `client/src/pages/enquiries/EnquiryDetailPage.tsx` and
`client/src/pages/enquiries/EnquirySummaryCard.tsx`. Presentation only — no API, schema, service or
business-rule changes._

## 1. Problem

The Enquiry Details page renders the same facts twice: once in the gradient summary hero
(`EnquirySummaryCard`) and again as labelled rows in the Overview tab's three info cards.

### Duplication inventory (verified against the current code)

| Field | Hero (`EnquirySummaryCard.tsx`) | Overview tab (`EnquiryDetailPage.tsx`) |
| --- | --- | --- |
| Customer name | InfoRow "Customer" | Customer card -> Row "Name" |
| Mobile | InfoRow "Mobile" | Customer card -> Row "Mobile" |
| Event type | InfoRow "Event Type" + subtitle fallback | Event card -> Row "Event Type" |
| Event name | Subtitle | Event card -> Row "Event Name" |
| Event date | InfoRow "Event Date" | Event card -> Row "Event Date" |
| Venue / Mahal | InfoRow "Venue" (`venue || mahal`) | Event card -> Rows "Mahal" and "Venue" |
| Appointment date | InfoRow "Appointment" | Appointment card -> Row "Date" |
| Appointment time | InfoRow "Appointment" | Appointment card -> Row "Time" |
| Appointment status | `StatusBadge` chip | Appointment card -> Row "Status" |
| Assigned user | "Assigned to ..." caption | Appointment card -> Row "Assigned To" |
| Estimated budget | Money tile | Event card -> Row "Estimated Budget" |
| Final budget | Money tile | Event card -> Row "Final Budget" |

Twelve repeated fields. Everything above the fold is repeated below it, so the Overview tab adds
almost no information.

### Alignment / polish problems

1. `Row` in `EnquiryDetailPage.tsx:30` puts the label left and the value hard-right with a divider
   between every row. Long values (discussion notes, addresses) wrap into a ragged right-aligned
   block, and no two cards line up with each other.
2. The cards use `flex: '1 1 320px'`, so the last card in a row stretches to fill leftover space —
   card widths change with viewport width and never form a clean column grid.
3. Cards have unequal heights (no `height: 100%`), leaving stepped bottom edges.
4. This page does not match `OrderEventInfoTab.tsx`, which already uses the product's intended
   pattern: an icon-led `InfoLine` (caption label above a semibold value, left aligned) inside a
   fixed CSS-grid of equal-height cards. The two detail pages should read as one product.
5. Contact detail rows (WhatsApp / Email / City) render only for prospect enquiries. Once an
   enquiry is linked to a customer the card collapses to a single link row — an almost empty card.

## 2. Target information architecture

One fact, one home. The hero answers "who, when, how much, what next"; the Overview tab holds the
supporting detail.

### Hero — `EnquirySummaryCard`

- Title: enquiry number. Subtitle: `eventName || eventType.eventName` (the record's human title).
- Six-item info grid: **Customer**, **Mobile**, **Assigned To**, **Event Date**, **Appointment**,
  **Enquiry Raised** (`createdAt` — currently not shown anywhere; tells staff how old the enquiry is).
- Chips: enquiry `StatusBadge` + appointment `StatusBadge`.
- Money tiles: Estimated Budget, Quotation (`quotationAmount` + version), Final Budget — the only
  place money appears on the page.
- Actions unchanged: Edit / Create Quotation / Call / WhatsApp.
- Removed from the hero: "Event Type" and "Venue" info rows (they move to the Event card), and the
  "Assigned to ..." caption (becomes a proper labelled grid item).

### Overview tab — three equal-height cards, then a full-width notes panel

1. **Customer** — avatar + customer name + customer-code chip as the card header, then labelled
   lines for **WhatsApp**, **Email**, **City**, **Address**. Footer: "View customer profile" button
   for a linked customer, or a "Prospect" chip explaining the record is created on order
   confirmation.
2. **Event Details** — **Event Type**, **Mahal**, **Venue**.
3. **Appointment** — **Meeting Location**, **Discussion Notes**, **Follow-ups** (count + date of the
   most recent one).
4. **Notes** — full width, `whiteSpace: pre-line`, unchanged behaviour.

No field from the table in section 1 now appears twice. `address` (already on `EnquiryProspect`) is
surfaced for the first time.

### Filling the Customer card for linked customers

Add a third query on the detail page:

```ts
const canViewCustomers = usePermission('CUSTOMERS', 'canView');
const { data: customerRecord } = useQuery({
  queryKey: ['customer', enquiry?.customer.id],
  queryFn: () => customerService.getById(enquiry!.customer.id!),
  enabled: Boolean(enquiry?.customer.id) && canViewCustomers,
});
const contact = enquiry.prospect ?? customerRecord ?? null; // both expose whatsapp/email/city/address
```

`GET /customers/:id` already exists and is guarded by `authorize(CUSTOMERS, 'canView')`
(`server/src/modules/customers/routes.ts:12`), so the query is gated on the same permission
client-side and the card falls back to "—" when the role cannot read customers. The
"View customer profile" button gets the same gate — today it can navigate a user to a page their
role cannot load.

## 3. Presentation components

Replace the right-aligned `Row` + divider pattern with the icon-led pattern already proven in
`OrderEventInfoTab.tsx`:

- `InfoLine({ icon, label, value })` — 28px tinted circle, `caption` label above a
  `body2 / weight 600` value, left aligned, `wordBreak: 'break-word'`. `value` renders as a `div` so
  chips and buttons can be passed.
- `InfoCard({ title, icon, children, footer })` — `Paper variant="outlined"`, `p: 2.5`,
  `borderRadius: '16px'`, `height: '100%'`, flex column with the footer pinned via `mt: 'auto'` so
  the three cards end flush.
- Card row: `display: grid`, `gap: 2.5`,
  `gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }` — replaces the
  `flex: '1 1 320px'` wrap so columns are equal and the layout is predictable at every breakpoint.

Unchanged: `Breadcrumbs`, `EnquiryProgressTracker`, `AppTabs`, the follow-up timeline, the
quotations `DataTable`, `EnquiryFollowUpDialog`, and every handler (`handleCall`, `handleWhatsApp`,
`showCreateQuotation` and its `canCreateQuotationForEnquiry` guard).

## 4. Implementation steps

1. `EnquirySummaryCard.tsx` — rework the info grid to the six items above; drop the Event Type and
   Venue rows and the assigned-to caption; add Assigned To and Enquiry Raised; keep the chips row
   for the two status badges. Icons: `PersonIcon`, `CallIcon`, `BadgeIcon`, `EventIcon`,
   `CalendarMonthIcon`, `HistoryIcon`.
2. `EnquiryDetailPage.tsx` — delete `Row`; add `InfoLine` and `InfoCard` (icon + optional footer).
3. Add the `customerService.getById` query + `usePermission('CUSTOMERS', 'canView')` gate, declared
   with the existing queries above the `isLoading` / not-found early returns so hook order is stable.
4. Rebuild `overviewTab`: the three cards in a CSS grid, then the Notes panel.
5. Leave the Follow-ups and Quotations tabs as they are, apart from reusing the new `InfoCard`
   shell so all sections share one visual language.
6. Verify: `npx tsc --noEmit -p tsconfig.app.json`; check the page as a prospect enquiry and as a
   linked-customer enquiry; check xs / md / lg breakpoints; confirm no field appears twice.

## 5. Out of scope

- No changes to enquiry APIs, Prisma schema, services or status transitions.
- `OrderEventInfoTab.tsx` has the same hero/tab overlap (customer name, event name, event date,
  venue). Not touched here — flagged as a follow-up so the Orders module can get the same treatment.
