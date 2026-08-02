# Orders Module - Filter & Table UI Enhancement

## Objective

Redesign the Orders Index page to provide faster searching, better filtering, and inline status management while maintaining a clean, modern UI.

---

# Page Layout

## Top Section

Display the page in the following order:

-------------------------------------------------------
Orders

[ + Create Order ]

-------------------------------------------------------

## Dashboard Cards

Display summary cards at the top.

- Total Orders
- Planning
- Work Started
- Event Completed
- Cancelled

Each card should:

- Show total count
- Have a unique color/icon
- Be clickable
- Apply the corresponding status filter
- Highlight the selected card

Example

-------------------------------------------------------
Total | Planning | Work Started | Completed | Cancelled
 120       35            48            30          7
-------------------------------------------------------

---

# Filters

Place all filters inside a single filter card.

## Filter Fields

### Customer

Type:
Searchable dropdown

Purpose:
Search orders by customer.

---

### Date Filter

Quick filters

Options

- Today
- This Week
- Next Week
- This Month
- Next Month

Only one option can be active.

Selecting one should automatically filter the table.

---

### Month Filter

Type

Month Picker

Purpose

Display all orders belonging to the selected month.

Example

January 2026

February 2026

March 2026

---

### Order Status

Dropdown

Options

- Planning Created
- Work Started
- Event Completed
- Order Cancelled

---

### Buttons

- Search
- Reset

Reset should clear every filter.

---

# Orders Table

Columns

| Column | Description |
|---------|-------------|
| Order No | Auto generated |
| Customer | Customer Name |
| Event | Event Name |
| Event Date | Event Date |
| Venue | Venue |
| Total Amount | Order Amount |
| Paid | Paid Amount |
| Balance | Remaining Amount |
| Status | Editable Dropdown |
| Actions | Existing Actions |

---

# Inline Status Editing

The Status column should contain a dropdown.

Available values

- Planning Created
- Work Started
- Event Completed
- Order Cancelled

Requirements

- User can change status directly from the table.
- No need to open Edit page.
- Show confirmation before updating.
- Update via AJAX/API without refreshing the page.
- Display success toast after update.
- Refresh dashboard counts automatically.

Example

Planning Created ▼

---

# Status Colors

Planning Created

- Blue

Work Started

- Orange

Event Completed

- Green

Order Cancelled

- Red

Display status as colored badges.

---

# Actions Column

Keep existing actions.

Examples

- View
- Edit
- Print
- Download PDF
- Share WhatsApp
- Delete

No functional changes required.

---

# UX Improvements

- Sticky table header.
- Zebra row styling.
- Hover effect on rows.
- Responsive layout.
- Pagination.
- Search should not reload the page.
- Filters should work instantly after clicking Search.
- Display loading spinner while fetching data.
- Show "No Orders Found" illustration when empty.

---

# Default Behavior

When opening the page

- Show all orders.
- Sort by Event Date (Nearest First).
- Dashboard counts should load immediately.
- No filter selected by default.

---

# Technical Requirements

- Use AJAX/API for filtering.
- Preserve selected filters after page refresh (optional using query parameters/local storage).
- Inline status update should call a dedicated API endpoint.
- Dashboard cards should refresh automatically after status changes.
- Keep response time under 500ms for normal datasets.

---

# Expected UI

--------------------------------------------------------------
Orders

+ Create Order

--------------------------------------------------------------

Dashboard

--------------------------------------------------------------
Total | Planning | Work Started | Completed | Cancelled
--------------------------------------------------------------

Filters

--------------------------------------------------------------
Customer ▼

Quick Date
○ Today
○ This Week
○ Next Week
○ This Month
○ Next Month

Month ▼

Status ▼

[ Search ]   [ Reset ]
--------------------------------------------------------------

Table

----------------------------------------------------------------------------------------------------------------------------------
Order No | Customer | Event | Event Date | Venue | Amount | Paid | Balance | Status ▼ | Actions
----------------------------------------------------------------------------------------------------------------------------------
ORD-1001 | Kumar | Wedding | 15 Aug 2026 | Chennai | ₹2,50,000 | ₹1,50,000 | ₹1,00,000 | Planning ▼ | 👁 ✏️ 📄 📱 🗑
ORD-1002 | Ravi | Birthday | 22 Aug 2026 | Coimbatore | ₹85,000 | ₹85,000 | ₹0 | Completed ▼ | 👁 ✏️ 📄 📱 🗑
----------------------------------------------------------------------------------------------------------------------------------
