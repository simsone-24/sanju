# Modern UI/UX Design Guidelines
## Event Management CRM

---

# Design Vision

Create a **modern, clean, premium SaaS-style dashboard** that is simple, intuitive, and user-friendly. The interface should prioritize readability, speed, and ease of navigation while maintaining a professional appearance.

### Design Principles

- Minimalistic Interface
- Clean Typography
- Consistent Spacing
- Soft Shadows
- Rounded Components
- Responsive Layout
- Accessible Color Contrast
- Smooth Animations
- Mobile Friendly

---

# Color Palette

## Primary

| Name | Color |
|-------|---------|
| Primary | #2563EB |
| Primary Hover | #1D4ED8 |

## Success

```
#22C55E
```

## Warning

```
#F59E0B
```

## Danger

```
#EF4444
```

## Info

```
#06B6D4
```

## Background

```
#F8FAFC
```

## Surface

```
#FFFFFF
```

## Border

```
#E5E7EB
```

## Text

Primary

```
#111827
```

Secondary

```
#6B7280
```

---

# Typography

Font

```
Inter
```

Fallback

```
system-ui
```

### Heading Sizes

| Element | Size |
|----------|------|
| H1 | 32px |
| H2 | 28px |
| H3 | 24px |
| H4 | 20px |
| Body | 16px |
| Small | 14px |

Font Weight

- 700
- 600
- 500
- 400

Line Height

```
1.5
```

---

# Layout

```
+---------------------------------------------------------+
| Header                                                  |
+-------------------+-------------------------------------+
| Sidebar           | Dashboard Content                   |
|                   |                                     |
|                   | KPI Cards                           |
|                   |                                     |
|                   | Charts                              |
|                   |                                     |
|                   | Recent Bookings                     |
|                   |                                     |
+-------------------+-------------------------------------+
```

---

# Sidebar

### Menu Items

- Dashboard
- Bookings
- Customers
- Calendar
- Payments
- Tasks
- Vehicles
- Inventory
- Reports
- Masters
- Users
- Settings

### Sidebar Style

- Width: 260px
- Rounded Active Item
- Icon + Label
- Collapsible
- Light Background
- Active Left Border
- Smooth Hover Animation

---

# Header

Include

- Search Bar
- Notification Bell
- Theme Switch
- User Profile
- Quick Create Button

Header Height

```
72px
```

---

# Dashboard

## Welcome Section

```
Good Morning 👋

Here's what's happening today.
```

---

## KPI Cards

Display

- Today's Bookings
- Upcoming Events
- Revenue
- Pending Payments
- Active Tasks
- Vehicles Assigned

Each Card Includes

- Icon
- Title
- Value
- Percentage Change
- Small Description

Example

```
📅

24

Today's Bookings

+12% from yesterday
```

---

# Cards

Style

- Border Radius: 16px
- Soft Shadow
- Padding: 24px
- Hover Elevation
- White Background

---

# Tables

Features

- Sticky Header
- Search
- Filter
- Pagination
- Export
- Column Sorting
- Responsive

Columns Example

- Customer
- Event
- Event Date
- Payment Status
- Order Status
- Actions

Row Hover

```
Background changes slightly
```

---

# Status Badges

Confirmed

Green

Pending

Orange

Completed

Blue

Cancelled

Red

Quotation Sent

Purple

In Progress

Cyan

Badge Style

- Rounded Pill
- Small Icon
- Soft Background

---

# Buttons

Primary

Filled Blue

Secondary

Outlined

Danger

Filled Red

Success

Filled Green

Icon Buttons

- View
- Edit
- Delete
- Download
- Print

Border Radius

```
12px
```

---

# Forms

Features

- Floating Labels
- Helper Text
- Required Indicator
- Validation Messages
- Responsive Grid

Spacing

```
24px
```

Input Height

```
48px
```

---

# Booking Details Page

Sections

## Customer Information

- Name
- Contact
- Address

## Event Information

- Event Type
- Venue
- Date
- Time

## Payment Summary

- Total Amount
- Advance
- Paid
- Balance

## Documents

- Quotation
- Invoice
- Images

## Notes

Rich Text Notes

---

# Booking Timeline

Display booking progress using a vertical timeline.

Example

```
Enquiry

↓

Appointment Confirmed

↓

Quotation Sent

↓

Advance Received

↓

Preparation Started

↓

Decoration Completed

↓

Event Completed

↓

Materials Returned

↓

Closed
```

---

# Calendar

Monthly

Weekly

Daily

Color Coding

Wedding

Pink

Birthday

Purple

Corporate

Blue

Temple Function

Orange

Government Event

Green

Features

- Drag & Drop
- Quick Preview
- Event Filter
- Search
- Add Event

---

# Customer Profile

Sections

- Personal Details
- Previous Bookings
- Payment History
- Documents
- Timeline
- Notes

Display Avatar

Customer Statistics

Lifetime Revenue

---

# Payment Module

Dashboard

Cards

- Total Revenue
- Pending Amount
- Overdue
- Today's Collection

Payment Progress

```
██████████░░░░
70%
```

Transaction Table

- Date
- Amount
- Method
- Status

---

# Task Management

Kanban View

```
Todo

↓

In Progress

↓

Completed
```

Features

- Drag & Drop
- Assign User
- Due Date
- Priority
- Comments
- Attachments

---

# Vehicle Module

Display

- Vehicle Name
- Driver
- Current Event
- Fuel Status
- Availability

Vehicle Timeline

Upcoming Trips

---

# Inventory

Dashboard

Cards

- Available Items
- Reserved
- Damaged
- Returned

Tables

Stock Movement

Rental History

---

# Reports

Charts

- Revenue
- Monthly Bookings
- Customer Growth
- Event Categories
- Payment Collection

Export

- Excel
- PDF
- Print

---

# Notifications

Examples

- Payment Pending
- Vehicle Assigned
- Task Due Today
- Event Tomorrow
- New Booking
- Quotation Approved

Notification Drawer

Grouped by

- Today
- Yesterday
- Earlier

---

# Global Search

Search

- Customers
- Bookings
- Payments
- Tasks
- Vehicles
- Inventory

Keyboard Shortcut

```
Ctrl + K
```

---

# Dark Mode

Support

- Light
- Dark
- System

---

# Loading States

Use

- Skeleton Loaders
- Progress Bars
- Spinner only when necessary

---

# Empty States

Instead of empty tables

Display

- Illustration
- Helpful Message
- Action Button

Example

```
No Bookings Yet

Create your first booking to get started.
```

---

# Error States

Friendly Messages

Example

```
Unable to load bookings.

Please try again.
```

Retry Button

---

# Responsive Design

Desktop

```
1440px+
```

Laptop

```
1024px
```

Tablet

```
768px
```

Mobile

```
375px+
```

Sidebar

Desktop

Expanded

Tablet

Collapsed

Mobile

Drawer

---

# Animations

Duration

```
150ms–250ms
```

Use

- Fade
- Slide
- Scale
- Hover Elevation

Avoid

- Heavy animations
- Long transitions
- Flashing effects

---

# Recommended UI Components

- Dashboard Cards
- Statistics Cards
- Data Tables
- Timeline
- Stepper
- Calendar
- Kanban Board
- Charts
- Modal Dialogs
- Drawers
- Toast Notifications
- Breadcrumbs
- Tabs
- Accordions
- Dropdown Menus
- Command Palette
- Progress Indicators
- File Upload
- Avatar Groups
- Empty States
- Skeleton Loaders

---

# UI Inspiration

Draw inspiration from leading SaaS products such as:

- Linear
- Notion
- Stripe Dashboard
- HubSpot CRM
- Monday.com
- ClickUp
- Airtable
- Vercel Dashboard
- GitHub
- Zoho CRM

---

# Final Goal

Build an Event Management CRM that feels fast, modern, and premium while remaining simple enough for non-technical users. Every screen should reduce unnecessary clutter, emphasize important actions, and provide a consistent experience across desktop, tablet, and mobile devices.