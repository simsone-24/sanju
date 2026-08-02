# Enquiry Index Page - Complete UI/UX Redesign Specification

## Objective

Redesign the Enquiry Index page to provide a modern, premium CRM experience comparable to HubSpot CRM, Zoho CRM, Salesforce, and Linear.

This redesign is focused only on UI/UX improvements. Existing business logic, API calls, permissions, and functionality should remain unchanged unless explicitly mentioned.

---

# Overall Design Goals

The page should feel:

- Modern
- Premium
- Professional
- Clean
- Spacious
- Easy to scan
- Optimized for daily CRM usage

Avoid a developer-style CRUD interface.

Instead, design it as a SaaS dashboard.

---

# Design Principles

Follow these UI principles throughout the page.

- 8px spacing system
- Consistent border radius
- Soft shadows
- Modern typography
- Proper visual hierarchy
- Consistent iconography
- Responsive layout
- Minimal visual noise
- Balanced whitespace

---

# Page Layout

```
------------------------------------------------------------

Dashboard > Enquiries

Enquiries                       [+ New Enquiry]

Manage all customer enquiries

------------------------------------------------------------

Dashboard Summary Cards

------------------------------------------------------------

Quick Filters

------------------------------------------------------------

Advanced Filters

------------------------------------------------------------

Enquiry Table

------------------------------------------------------------

Pagination

------------------------------------------------------------
```

Reduce unnecessary top padding.

Use the available screen width efficiently.

---

# Header Improvements

Current layout wastes vertical space.

Expected layout

Left

```
Dashboard > Enquiries

Enquiries

Manage all customer enquiries
```

Right

```
+ New Enquiry
```

Use flex layout.

---

# Dashboard Summary Cards

Increase the visual quality of summary cards.

Each card should include

- Large Icon
- Count
- Title
- Small subtitle
- Hover animation
- Active state
- Click interaction

Cards

1. Pending Appointments
2. In Progress
3. Quotation To Share
4. Quotation Shared

Example

```
📅

18

Pending Appointments

+3 Today
```

Hover

- Slight lift
- Shadow
- Border highlight

Active

- Blue border
- Slight background change

Clicking a card should automatically apply the related filter.

---

# Card Colors

Pending

Amber

In Progress

Orange

Quotation To Share

Yellow

Quotation Shared

Blue

Keep colors subtle.

Avoid highly saturated backgrounds.

---

# Quick Filters

Replace plain buttons with pill filters.

Example

```
All

Today

Tomorrow

This Week

This Month

Upcoming

Completed
```

Requirements

- Rounded pills
- Active state
- Hover animation

---

# Advanced Filters

Group filters into a clean toolbar.

Layout

```
--------------------------------------------------------

Search

Appointment Date

Event Date

Appointment Status

Enquiry Status

Reset

--------------------------------------------------------
```

Search should occupy the most width.

Date pickers should be aligned.

Dropdowns should have equal width.

Reset button should clear every filter including active dashboard cards.

---

# Search Box

Placeholder

```
Search enquiry number, customer, mobile, event...
```

Requirements

- Search icon
- 44-48px height
- Rounded corners
- Proper padding

---

# Date Pickers

Improve usability.

Requirements

- Entire input should open calendar
- Not only calendar icon
- Modern calendar popup
- Clear button

---

# Dropdowns

Improve dropdown design.

Requirements

- Rounded corners
- Better spacing
- Searchable if large list
- Same height as search box

---

# Table Redesign

Current table is information-heavy.

Redesign using better hierarchy.

Columns

1. Enquiry
2. Customer
3. Event
4. Event Date
5. Appointment
6. Assigned To
7. Appointment Status
8. Enquiry Status
9. Actions

---

# Enquiry Column

Display

```
ENQ-2026-00015

Created

24 Jul 2026
```

Enquiry number

Bold

Created date

Small secondary text

---

# Customer Column

Display

```
Avatar

Simsone

9837876867

email@email.com
```

Customer name

Bold

Phone

Secondary

Email optional

---

# Event Column

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

# Event Date

Display

```
31 Jul 2026

Fri
```

Do not split into multiple lines unnecessarily.

---

# Appointment Column

Display

```
27 Jul 2026

10:30 AM
```

---

# Assigned User

Instead of plain text

```
Sanju
```

Display

```
Avatar

Sanju
```

Use initials when profile image is unavailable.

---

# Status Design

Appointment Status

Examples

Pending

Assigned

In Progress

Completed

Cancelled

Enquiry Status

Examples

New

Quotation To Share

Quotation Shared

Appointment Fixed

Order Confirmed

Cancelled

Requirements

- Rounded badges
- Small padding
- Consistent height
- Consistent font size

Do not use oversized status chips.

---

# Actions

Current action buttons occupy too much space.

Replace with

Primary

View

Edit

More Menu

Example

```
👁

✏

⋮
```

Dropdown Menu

View

Edit

Create Quotation

Schedule Appointment

Download PDF

Send WhatsApp

Delete

Use tooltips for every icon.

---

# Table Improvements

Implement

- Sticky Header
- Zebra Row Background
- Hover Effect
- Better Row Padding
- Column Sorting
- Better Empty State
- Better Loading Skeleton
- Responsive Horizontal Scroll

---

# Typography

Use clear typography hierarchy.

Page Title

32px

Bold

Section Title

20px

Semi Bold

Table Header

12px

Uppercase

Letter spacing

Body

14-15px

Medium

Secondary text

12px

Muted

---

# Colors

Background

Very Dark Blue

Cards

Dark Slate

Table Header

Slightly Darker

Border

Subtle

Primary

Blue

Success

Green

Warning

Amber

Danger

Red

---

# Icons

Use a single icon library throughout the application.

Recommended

Lucide Icons

or

Heroicons

Do not mix icon styles.

---

# Hover Effects

Cards

Lift slightly

Rows

Background highlight

Buttons

Smooth transition

Status

Subtle glow

Use transitions around 200ms.

---

# Spacing

Follow an 8px spacing system.

Recommended

Between Sections

32px

Inside Cards

24px

Inside Table

16px

Between Components

24px

Avoid cramped layouts.

---

# Border Radius

Cards

16px

Inputs

12px

Buttons

10px

Status Chips

999px

Maintain consistency.

---

# Responsive Behaviour

Desktop

Multi-column layout

Tablet

Cards become 2 per row

Filters wrap properly

Mobile

Cards

2 per row

Filters

Stack vertically

Table

Horizontal scroll

Action buttons collapse into overflow menu

---

# Animations

Use subtle animations only.

Dashboard Cards

Hover

Scale 1.02

Search

Smooth focus border

Buttons

Transition

Rows

Hover highlight

Avoid excessive animations.

---

# Accessibility

Maintain sufficient color contrast.

Keyboard navigation should work for

- Search
- Dropdowns
- Date pickers
- Action buttons

Add tooltips where appropriate.

---

# Performance

Avoid unnecessary component re-renders.

Dashboard cards should update dynamically based on filtered data.

Filtering should feel instant.

---

# Expected User Experience

The page should immediately communicate important information through dashboard cards.

Users should be able to:

- Identify pending work instantly.
- Apply filters with one click.
- Find enquiries quickly.
- Read records without visual clutter.
- Perform common actions with minimal clicks.

The interface should feel polished, modern, and suitable for a commercial Event Management CRM product.

---

# Important Development Instructions

- Do **not** change any existing business logic.
- Preserve all current API integrations.
- Preserve routing and permissions.
- Focus only on UI/UX improvements.
- Reuse existing components wherever possible.
- Refactor component structure only if it improves maintainability.
- Follow responsive design best practices.
- Ensure consistent styling across the entire Enquiry module.

---

# Reference Inspiration

Use the following products as UI/UX references:

- HubSpot CRM
- Zoho CRM
- Salesforce Lightning
- Linear
- Notion
- Vercel Dashboard
- Raycast
- Stripe Dashboard

The final result should resemble a modern SaaS CRM rather than a standard CRUD administration panel.