# Enquiry Module - Index Page UI Enhancement

## Objective

Redesign the Enquiry Index page to make it more user-friendly, dashboard-oriented, and suitable for daily operations. The page should allow users to quickly understand pending work, filter records with a single click, and access important enquiries without searching manually.

---

# Page Layout

```
--------------------------------------------------------------
Breadcrumb

Enquiries                                   + New Enquiry

Total Records : XXX

--------------------------------------------------------------
Dashboard Cards
--------------------------------------------------------------

Pending Appointments | In Progress | Quotation to Share | Quotation Shared

--------------------------------------------------------------
Advanced Filters
--------------------------------------------------------------

Search | Appointment Status | Enquiry Status

Appointment Date (From - To)

Event Date (From - To)

Reset Filters

--------------------------------------------------------------
Enquiry Table

--------------------------------------------------------------
Pagination
```

---

# Dashboard Cards

Move the summary counts to the top of the page.

Each card should display

- Icon
- Count
- Title
- Color
- Clickable

---

## 1. Pending Appointments

Shows

- Total enquiries where Appointment Status = Pending

Example

```
Pending Appointments

18
```

Color

Amber

Click Action

Automatically filter

```
Appointment Status = Pending
```

---

## 2. In Progress Appointments

Shows

Appointment Status

```
In Progress
```

Example

```
In Progress

9
```

Color

Orange

Click Action

Automatically filter

```
Appointment Status = In Progress
```

---

## 3. Quotation To Share

Shows enquiries where

```
Enquiry Status = Quotation To Share
```

Example

```
Quotation To Share

12
```

Color

Yellow

Click Action

Apply filter automatically.

---

## 4. Quotation Shared

Shows

```
Enquiry Status = Quotation Shared
```

Example

```
Quotation Shared

6
```

Color

Blue

Click Action

Automatically filter.

---

# Card Behaviour

When clicking any dashboard card

- Card becomes active
- Related filter applied automatically
- Table refreshes
- Active card highlighted
- Clicking again removes filter

Example

```
Click

Pending Appointment

↓

Appointment Status = Pending

↓

Only pending appointment records displayed.
```

---

# Advanced Filters

The current filters should be reorganized into a cleaner layout.

## Row 1

Search Box

Placeholder

```
Search by

Enquiry No
Customer Name
Mobile Number
Function
Assigned Staff
```

Width

Large

---

Appointment Status

Dropdown

Example

```
All

Pending

Assigned

In Progress

Completed

Cancelled
```

---

Enquiry Status

Dropdown

Example

```
All

New Enquiry

Quotation To Share

Quotation Shared

Appointment Fixed

Order Confirmed

Cancelled
```

---

## Row 2

Appointment Date

```
From Date

To Date
```

---

Event Date

```
From Date

To Date
```

---

Buttons

```
Search

Reset Filters
```

Reset should clear

- Dashboard card selection
- Search
- All filters

---

# Table Redesign

Current table feels crowded.

Use better spacing and hierarchy.

Remove unnecessary text.

Increase row height.

Use modern badges.

Rounded chips.

Hover effect.

Sticky header.

Alternate row background.

---

# Recommended Columns

| Column | Description |
|----------|-------------|
| Enquiry | Enquiry Number |
| Customer | Name + Mobile |
| Event | Event Type |
| Event Date | Date |
| Appointment | Appointment Date |
| Assigned To | Staff |
| Appointment Status | Badge |
| Enquiry Status | Badge |
| Actions | Icons |

---

# Column Details

## Enquiry

Display

```
ENQ-2026-00015

Created
21 Jul 2026
```

Small secondary text below.

---

## Customer

Display

```
👤 Simsone

9837876867

simsone@email.com
```

Primary

Customer Name

Secondary

Mobile

Optional

Email

---

## Event

Display

```
Wedding

250 Guests
```

or

```
Birthday

100 Guests
```

---

## Event Date

Display

```
31 Jul 2026

Friday
```

---

## Appointment

Display

```
27 Jul 2026

10:30 AM
```

---

## Assigned To

Display

Avatar

```
S
```

or

User Image

```
Sanju
```

---

## Appointment Status

Colored badge

Pending

Amber

Assigned

Blue

In Progress

Orange

Completed

Green

Cancelled

Red

---

## Enquiry Status

Colored badge

New

Gray

Quotation To Share

Yellow

Quotation Shared

Blue

Appointment Fixed

Purple

Order Confirmed

Green

Cancelled

Red

---

## Actions

Replace text buttons with icons.

Recommended

👁 View

✏ Edit

📄 Create Quotation

📥 Download PDF

🟢 WhatsApp

📅 Appointment

🗑 Delete

Use Tooltips.

---

# Table Improvements

- Sticky Header
- Zebra Row Colors
- Hover Highlight
- Rounded Status Chips
- Responsive Table
- Horizontal Scroll only when required
- Compact Action Icons
- Better Padding
- Modern Typography
- Column Sorting
- Pagination at Bottom Right

---

# Quick Filters

Above table

```
All

Today

This Week

This Month

Upcoming Events
```

One click filtering.

---

# Empty State

If no records found

Show

```
📭

No enquiries found.

Try changing filters.

[ Reset Filters ]
```

---

# Loading State

Use skeleton loaders.

- Dashboard Cards
- Filters
- Table

Avoid showing blank page.

---

# Mobile Responsive

Cards

2 per row

Filters

Stack vertically

Table

Responsive horizontal scroll

Action icons collapse into menu

---

# UI Color Suggestions

Pending

```
#F59E0B
```

In Progress

```
#F97316
```

Quotation To Share

```
#EAB308
```

Quotation Shared

```
#3B82F6
```

Appointment Fixed

```
#8B5CF6
```

Order Confirmed

```
#10B981
```

Cancelled

```
#EF4444
```

---

# Expected User Flow

1. User opens Enquiry page.
2. Dashboard cards immediately display current enquiry statistics.
3. User clicks a dashboard card (e.g., **Pending Appointments**) to instantly filter the table.
4. User can further refine results using **Search**, **Appointment Status**, **Enquiry Status**, **Appointment Date**, or **Event Date** filters.
5. The redesigned table presents enquiry information in a clean, readable format with clear status badges and compact action icons.
6. Users can quickly view, edit, create quotations, schedule appointments, download PDFs, or send quotations via WhatsApp directly from the table.

---

# Expected Outcome

- Faster identification of pending work.
- Reduced time spent searching for enquiries.
- Cleaner and more professional UI.
- Improved readability of enquiry records.
- One-click filtering from dashboard summary cards.
- Better productivity for daily CRM operations.
- Consistent design aligned with the overall Event Management Portal.