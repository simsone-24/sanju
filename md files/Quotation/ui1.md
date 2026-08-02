# Quotation Module UI/UX Redesign Specification

**Project:** Event ERP Management Suite  
**Module:** Quotations  
**Prepared By:** Senior UI/UX Review (10+ Years Experience)

---

# Objective

Transform the current quotation module into a premium SaaS-style ERP interface similar to Zoho CRM, Freshworks, Linear, and Razorpay Dashboard.

The UI should prioritize:

- Modern appearance
- Fast workflow
- Better visual hierarchy
- Less clutter
- Better data readability
- Mobile responsiveness
- Premium user experience

---

# Overall Layout

```
-------------------------------------------------------------
Breadcrumb

Dashboard > Quotations

-------------------------------------------------------------

Quotation Management

Manage customer quotations, revisions, approvals,
PDF generation and WhatsApp sharing.

                                    [+ Create Quotation]

-------------------------------------------------------------

Dashboard Cards

-------------------------------------------------------------

Filters

-------------------------------------------------------------

Quotation Table

-------------------------------------------------------------
```

---

# Page Header

Replace

```
Quotations

4 Total Records
```

With

```
Quotation Management

Manage customer quotations, revisions,
PDF downloads and WhatsApp sharing.

4 Quotations

Last Updated:
Today 10:30 AM
```

### Benefits

- Better visual hierarchy
- Professional appearance
- Gives context to users

---

# Dashboard Summary Cards

Add KPI cards before filters.

```
-------------------------------------------------------------

Draft

12

📝

-------------------------------------------------------------

Sent

8

📤

-------------------------------------------------------------

Approved

6

✅

-------------------------------------------------------------

Revenue

₹2,48,500

💰

-------------------------------------------------------------
```

### Card Behaviour

- Click card to filter records
- Hover animation
- Soft shadow
- Rounded corners
- Small trend indicator

Example

```
+18% this month
```

---

# Search & Filter Section

Wrap filters inside one white card.

Current

```
Search

Source

Status
```

New

```
------------------------------------------------------------

🔍 Search quotation no/customer/mobile

Status ▼

Source ▼

Date Range ▼

Reset

Search

------------------------------------------------------------
```

### Filters

- Search
- Status
- Source
- Date Range
- Created By (Optional)
- Customer (Optional)

---

# Create Button

Replace

```
+ New Quotation
```

With

```
+ Create Quotation
```

### Style

- Blue Gradient
- White Text
- Rounded
- Shadow
- Hover Animation

Size

44px height

Border Radius

12px

---

# Table Improvements

Current table looks flat.

Improve using

- Soft borders
- Alternate row colors
- Hover highlight
- Sticky header
- Better spacing

---

# Table Columns

Recommended

| Column | Notes |
|----------|----------------|
| Quotation No | Show version badge |
| Customer | Avatar + Name |
| Mobile | Click to call |
| Amount | Bold |
| Status | Colored badge |
| Date | Relative + Full Date |
| Actions | Icon menu |

---

# Quotation Number

Instead of

```
QTN-2026-00004

(v2)
```

Use

```
QTN-2026-00004

Revision 2
```

Or

```
QTN-2026-00004

v2
```

Display revision badge beside quotation number.

---

# Customer Column

Current

```
meshak
```

Improve

```
[M]

Meshak

Premium Customer
```

Avatar color generated automatically.

---

# Phone Number

Display

```
📞 9876543210
```

Click opens

```
tel:
```

---

# Amount Column

Current

```
₹10,800
```

Improve

```
₹10,800

GST Included
```

Amount

Font Weight

700

---

# Status Badge

Current badges are too wide.

Use compact pills.

Draft

Grey

```
🟡 Draft
```

Sent

Blue

```
🔵 Sent
```

Approved

Green

```
🟢 Approved
```

Rejected

Red

```
🔴 Rejected
```

Cancelled

Dark Grey

---

# Revision Badge

Instead of

```
2 Revisions
```

Use

```
v2
```

Small outlined badge.

---

# Actions

Current

```
👁

⬇

WhatsApp
```

Replace with

```
👁 View

✏ Edit

📄 PDF

🟢 WhatsApp

⋮ More
```

More Menu

```
View

Edit

Duplicate

Create Revision

Convert to Order

Delete
```

---

# Table Hover

Hover row

Background

```
#F8FAFC
```

Cursor

Pointer

---

# Empty State

If no quotations exist

```
📄

No quotations found.

Create your first quotation.

[ Create Quotation ]
```

---

# Right Side Activity Panel (Optional)

```
Today's Activity

--------------------

4 Quotations Created

2 Approved

1 Sent

Revenue

₹15,600

Recent Customers

Meshak

Rahul

Simson
```

---

# Sidebar Improvements

Current sidebar is template-like.

Improve

```
🏠 Dashboard

-----------------------------

OPERATIONS

📋 Enquiries

📄 Quotations

🛒 Orders

📅 Calendar

-----------------------------

MANAGEMENT

👥 Customers

📊 Reports

⚙ Masters

-----------------------------

Workspace

Storage

████████░░

68%
```

Bottom

```
Avatar

Sanju

Super Admin

⚙ Settings

🌙 Dark Mode

Logout
```

---

# Colors

Primary

```
#2563EB
```

Primary Hover

```
#1D4ED8
```

Background

```
#F8FAFC
```

Card

```
#FFFFFF
```

Border

```
#E5E7EB
```

Text

```
#111827
```

Secondary Text

```
#6B7280
```

Success

```
#16A34A
```

Warning

```
#F59E0B
```

Danger

```
#DC2626
```

---

# Typography

Font

```
Inter
```

or

```
Poppins
```

Page Title

32px

Bold

Section Heading

20px

Bold

Table Header

14px

Semi Bold

Table Content

14px

Medium

Caption

12px

---

# Card Design

Border Radius

```
16px
```

Shadow

```
0 6px 18px rgba(0,0,0,.08)
```

Padding

```
24px
```

---

# Buttons

Primary

Blue Gradient

Secondary

White

Outline

Success

Green

Danger

Red

All Buttons

Height

```
44px
```

Border Radius

```
12px
```

---

# Responsive Design

Desktop

Dashboard cards

Filter row

Large table

Tablet

2 cards per row

Compact table

Mobile

Cards become stacked

Table becomes card layout

```
Quotation

QTN-2026-0004

Meshak

₹10,800

Approved

View

WhatsApp
```

No horizontal scrolling.

---

# Animations

Use subtle animations.

Hover

```
transform: translateY(-2px);
transition: .2s;
```

Cards

```
scale(1.02)
```

Buttons

Shadow increase

Table Row

Background fade

---

# User Experience Improvements

- Sticky page header
- Sticky table header
- Save filter state
- Keyboard shortcut (Ctrl + K) for search
- Tooltips for all icons
- Loading skeleton while fetching data
- Confirmation dialog before delete
- Toast notifications for actions
- Auto-refresh dashboard statistics

---

# Expected Result

The redesigned quotation module should feel like a modern SaaS ERP instead of a standard admin template.

The interface should emphasize:

- Clean layout
- Premium aesthetics
- Faster navigation
- Better readability
- Action-oriented workflow
- Professional business appearance

---

# Target Design References

- Zoho CRM
- Freshworks CRM
- Razorpay Dashboard
- Linear
- Notion
- Vercel Dashboard
- Stripe Dashboard

---

# UI Quality Target

Current UI

⭐ 6.8 / 10

Expected After Redesign

⭐ 9.6 / 10