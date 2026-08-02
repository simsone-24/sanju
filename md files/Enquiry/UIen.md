# Enquiry Module UI Enhancement Specification

## Objective

Redesign the Enquiry Index page to look like a premium SaaS CRM instead of a traditional admin panel.

The UI should feel similar to:
- Linear
- Stripe Dashboard
- HubSpot CRM
- Notion
- Vercel Dashboard

Focus on:
- Better spacing
- Cleaner hierarchy
- Premium cards
- Modern filters
- Improved table
- Better user experience

---

# Overall Layout

```
----------------------------------------------------------
Dashboard > Enquiries

Enquiries                              [+ New Enquiry]

Manage customer enquiries and appointments.

----------------------------------------------------------

[KPI Cards]

----------------------------------------------------------

[Search + Filters]

----------------------------------------------------------

[Enquiry Table]

----------------------------------------------------------
```

The page should have consistent spacing (24px), rounded corners (16px), subtle shadows, and light borders.

---

# Header

## Left

Display

- Breadcrumb
- Large page title
- Small subtitle

Example

Dashboard > Enquiries

# Enquiries

Manage all customer enquiries and appointments.

---

## Right

Primary Button

+ New Enquiry

Style

- Background: Primary Blue
- Rounded: 12px
- Height: 44px
- Hover animation
- Shadow

---

# KPI Dashboard Cards

Replace the existing plain statistic cards with premium dashboard cards.

Cards:

1. Pending Appointments
2. In Progress
3. Quotation To Share
4. Quotation Shared

Each card should contain

Large Icon

Title

Large Count

Small subtitle

Example

Pending Appointments

12

+2 Since Yesterday

Hover Effect

- Slight lift
- Shadow increases
- Cursor pointer

Clicking a card should automatically apply the corresponding filter.

---

# Card Colors

Pending

Background
#FFF7ED

Icon
Orange

Progress

Background
#EFF6FF

Icon
Blue

Quotation Pending

Background
#FEFCE8

Icon
Yellow

Quotation Shared

Background
#ECFDF5

Icon
Green

---

# Quick Filters

Replace the existing chips.

Use rounded filter pills.

Example

All

Today

This Week

This Month

Upcoming Events

Completed

Cancelled

Active pill should have

Primary background

White text

Inactive pills

White background

Light border

Hover effect

---

# Search & Filters

Current filter section is too large.

Compress it into a cleaner layout.

First Row

Search

Appointment Status

Enquiry Status

Assigned User

Event Type

Second Row

Appointment From

Appointment To

Event From

Event To

Reset

Apply Filters

The Apply button should use the primary theme color.

Reset should be outlined.

---

# Advanced Filters

Instead of showing every filter immediately

Show

Advanced Filters ▼

When clicked

Expand

- Date filters
- Event filters
- Assigned user
- Other filters

---

# Search Box

Large width

Leading search icon

Placeholder

Search by

- Enquiry Number
- Customer Name
- Mobile Number
- Event Name

---

# Data Table

Replace the default Material UI table appearance.

Requirements

Rounded container

Alternate row colors

More spacing

Hover effect

Sticky header

Better typography

---

# Table Columns

Enquiry

Customer

Event

Event Date

Appointment

Assigned User

Appointment Status

Quotation Status

Actions

---

# Table Row

Instead of only text

Show secondary information.

Example

ENQ-2026-00004

Created
27 Jul 2026

--------------------------------

meshak

8778467890

--------------------------------

Wedding

--------------------------------

03 Aug 2026

--------------------------------

29 Jul 2026

--------------------------------

Avatar

Sanju

Sales Executive

--------------------------------

Completed

--------------------------------

Actions

---

# Status Badge

Replace plain badges.

Use rounded pills.

Completed

Green

Scheduled

Blue

Pending

Orange

Cancelled

Red

Draft

Gray

Each badge should contain

Status icon

Status text

---

# Row Highlight

Add a small colored border on the left.

Green

Completed

Orange

Pending

Blue

Quotation Shared

Red

Cancelled

Improves scanning.

---

# Actions

Replace tiny icons.

Each action should be inside a circular button.

Actions

View

Edit

Quotation

WhatsApp

More

Hover

Light background

Smooth animation

---

# Assigned User

Instead of

S

Sanju

Display

Avatar

Sanju

Sales Executive

Use colored avatar.

---

# Pagination

Keep pagination inside the card footer.

Display

Rows per page

Current records

Next

Previous

Use rounded controls.

---

# Empty State

If no enquiries exist

Display

Illustration

"No enquiries found"

Create your first enquiry.

Button

+ New Enquiry

---

# Loading State

Instead of blank page

Use skeleton loaders

Cards

Filters

Table

---

# Colors

Primary

#2563EB

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

Background

#F8FAFC

Card

#FFFFFF

Border

#E2E8F0

Text

#0F172A

Muted Text

#64748B

---

# Typography

Font

Inter

Page Title

36px

Section Title

20px

Card Count

32px

Table Header

14px

Body

15px

Badge

12px

---

# Border Radius

Cards

16px

Buttons

12px

Inputs

12px

Badges

999px

Avatar

50%

---

# Shadows

Cards

Soft shadow

Hover

Medium shadow

Buttons

Small shadow

Avoid heavy shadows.

---

# Animations

Cards

Hover lift

Buttons

Smooth background transition

Rows

Highlight on hover

Filter pills

Scale slightly on hover

Duration

200ms

---

# Responsive Behaviour

Desktop

4 KPI cards

Tablet

2 KPI cards

Mobile

1 KPI card

Filters stack vertically

Table becomes horizontally scrollable

---

# UX Improvements

- Clicking KPI cards automatically filters the table.
- Search updates results instantly (debounced).
- Preserve filter state after refresh.
- Sticky table header during scrolling.
- Sticky "New Enquiry" button on smaller screens.
- Display total record count beside the page title.
- Use consistent spacing throughout the page.
- Reduce unnecessary whitespace.
- Maintain a clean, premium SaaS appearance.

---

# Final Goal

The Enquiry module should resemble a modern enterprise CRM with excellent visual hierarchy, clean spacing, premium cards, intuitive filters, and an easy-to-scan table while preserving all existing business functionality.