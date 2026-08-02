# UI/UX Redesign Requirements
## Event Management Portal

---

# Objective

Redesign the entire Event Management Portal with a **modern, premium, clean, and user-friendly interface**. The application should provide an excellent user experience for daily operations while maintaining consistency across every module.

The design should feel similar to professional SaaS applications such as **Linear, Notion, Stripe Dashboard, ClickUp, HubSpot, Zoho CRM, and Vercel Dashboard**.

The primary goal is to make the system:

- Easy to learn
- Fast to navigate
- Visually clean
- Consistent across all pages
- Optimized for daily business operations

---

# Design Principles

- Minimal and modern UI
- Clean typography
- Spacious layout with proper whitespace
- Consistent spacing using an 8px grid
- Rounded corners (12–16px)
- Soft shadows
- Subtle animations (150–250ms)
- Responsive across Desktop, Tablet, and Mobile
- Accessible color contrast
- Professional business appearance

Avoid:

- Outdated admin panel designs
- Heavy borders
- Bright gradients
- Excessive colors
- Crowded forms
- Inconsistent spacing
- Different UI styles between modules

---

# Application Layout

Use a fixed sidebar with a responsive content area.

```
+-------------------------+----------------------------------------+
|                         |                                        |
|                         |                                        |
|        Sidebar          |             Main Content               |
|                         |                                        |
|                         |                                        |
|                         |                                        |
+-------------------------+----------------------------------------+
```

The sidebar should remain fixed while only the content area scrolls.

---

# Sidebar Redesign

The sidebar should be modern, elegant, and easy to navigate.

### Features

- Fixed width (260px)
- Collapsible
- Smooth expand/collapse animation
- Rounded active menu item
- Icons with labels
- Section grouping
- Sticky company logo
- Scrollable navigation when needed

### Navigation Structure

Dashboard

Operations
- Enquiries
- Quotations
- Bookings
- Calendar

Management
- Customers
- Payments
- Tasks
- Vehicles
- Inventory

Administration
- Reports
- Masters
- Users
- Roles
- Settings

### Sidebar Behavior

- Active item should have a colored indicator and soft background
- Hover effects should be smooth and subtle
- Maintain consistent spacing between menu groups
- Use a single icon set (Lucide Icons recommended)

---

# Page Layout

Each module should begin with a clean page header.

Example

Bookings

Manage customer bookings and event schedules.

                             [+ New Booking]

Below the page title:

- Search
- Filters
- Export
- Refresh
- View Options

Then display the module content.

---

# Dashboard

The dashboard should provide a quick overview of business activity.

### Welcome Section

Good Morning 👋

Here's an overview of today's business activity.

---

### KPI Cards

Display:

- Total Bookings
- Upcoming Events
- Pending Quotations
- Total Revenue
- Pending Payments
- Active Tasks

Each card should include:

- Icon
- Large value
- Title
- Percentage change
- Short description

---

### Dashboard Widgets

- Revenue Chart
- Booking Trend
- Upcoming Events
- Recent Activities
- Payment Summary
- Calendar Preview
- Task Summary

---

# List Pages

All modules should follow the same layout.

Include:

- Page title
- Description
- Primary action button
- Search
- Filters
- Export
- Refresh
- Modern data table

---

# Data Tables

Every table should include:

- Sticky header
- Search
- Sorting
- Filtering
- Pagination
- Export
- Responsive layout
- Hover effects
- Status badges
- Row actions

Actions

- View
- Edit
- Delete
- Print
- Download

---

# Create & Edit Pages

Forms should never open inside the table.

Use dedicated pages.

Examples

/bookings/create

/bookings/{id}/edit

This provides a cleaner workflow and improves usability.

---

# Form Layout

Forms should be centered with a maximum width of 1000–1200px.

Divide long forms into cards such as:

- Customer Information
- Event Information
- Venue Details
- Payment Details
- Additional Notes
- Attachments

Use a responsive two-column layout where appropriate.

---

# Form Controls

Every input should be modern and easy to use.

Requirements

- Consistent height
- Rounded corners
- Clear labels
- Placeholder text
- Validation messages
- Helper text
- Keyboard accessibility

---

# Date Picker

Improve the date picker interaction.

The calendar should open when:

- Clicking anywhere inside the input
- Clicking the calendar icon
- Using keyboard navigation

The entire input should be clickable.

---

# Time Picker

The time picker should behave the same way.

Users should not be required to click only the clock icon.

---

# Dropdowns

Use searchable dropdowns.

Features:

- Search
- Keyboard navigation
- Clear selection
- Placeholder text

---

# Cards

All cards should use:

- White background
- Rounded corners
- Soft shadow
- 24px padding
- Hover elevation

---

# Status Badges

Replace plain text with colored badges.

Examples

- Confirmed (Green)
- Pending (Orange)
- Cancelled (Red)
- Completed (Blue)
- In Progress (Cyan)
- Quotation Sent (Purple)

---

# Booking Module

Improve:

- Booking list
- Booking details
- Event timeline
- Customer summary
- Payment summary
- Notes
- Documents

---

# Enquiry Module

Display:

- Customer
- Appointment
- Follow-up
- Priority
- Assigned Staff
- Status

---

# Quotation Module

Modern quotation page with:

- Quotation status
- Items
- Tax
- Discount
- Total
- PDF Preview
- Print
- Download
- Send via WhatsApp
- Send Email

---

# Customer Module

Customer profile should include:

- Avatar
- Contact Information
- Event History
- Payment History
- Notes
- Documents
- Statistics

---

# Calendar Module

Support:

- Month View
- Week View
- Day View
- Agenda View

Color-code events by type.

Allow:

- Drag & Drop
- Quick Preview
- Event Details Popup

---

# Payment Module

Dashboard should display:

- Total Collected
- Pending
- Overdue
- Today's Collection

Include:

- Progress bars
- Payment timeline
- Transaction history

---

# Task Module

Kanban Board

Columns

- Todo
- In Progress
- Completed

Support:

- Drag & Drop
- Due Dates
- Priority
- Comments
- Attachments

---

# Vehicle Module

Display:

- Vehicle
- Driver
- Status
- Assigned Event
- Upcoming Trips
- Maintenance Status

---

# Inventory Module

Dashboard Cards

- Available
- Reserved
- Damaged
- Returned

Include stock movement history.

---

# Reports

Provide interactive dashboards with:

- Revenue
- Bookings
- Payments
- Customer Growth
- Event Categories

Export options:

- PDF
- Excel
- Print

---

# Global Search

Allow searching across:

- Customers
- Bookings
- Quotations
- Payments
- Tasks
- Vehicles
- Inventory

Keyboard shortcut:

Ctrl + K

---

# Notifications

Modern notification panel.

Group notifications by:

- Today
- Yesterday
- Earlier

Display unread count.

---

# Loading States

Use skeleton loaders instead of full-page spinners.

---

# Empty States

Every module should have meaningful empty states.

Example

No bookings found.

Create your first booking to get started.

[+ New Booking]

---

# Error States

Display clear error messages with retry actions.

Example

Unable to load bookings.

[Retry]

---

# Responsive Design

Desktop

- Full sidebar

Tablet

- Collapsible sidebar

Mobile

- Drawer navigation

Forms and tables should adapt gracefully to smaller screens.

---

# UI Consistency

Every module must use the same:

- Typography
- Color palette
- Buttons
- Cards
- Tables
- Forms
- Icons
- Status badges
- Page spacing
- Animations

The user should feel like they are using one unified application, regardless of which module they are in.

---

# Expected Result

The final Event Management Portal should deliver a polished, premium SaaS experience with intuitive navigation, consistent design, responsive layouts, and streamlined workflows. Every module should be clean, fast, visually appealing, and optimized for both new and experienced users, making daily operations efficient and enjoyable.