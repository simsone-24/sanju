# Quotation Module UI/UX Flow Improvement

## Objective

The Quotation module should have its own complete workflow.

Currently:

```
Quotation List
      ↓
Click Row
      ↓
Enquiry View Page ❌
```

Expected:

```
Quotation List
      ↓
Click Row
      ↓
Quotation View Page ✅
```

This keeps users focused on the quotation instead of navigating back to the enquiry.

---

# New Navigation Flow

## Enquiry

```
Enquiry List

↓

View Enquiry

↓

Create Quotation
```

Once a quotation is created,

the quotation should be managed from the **Quotation Module**, not from the enquiry.

---

## Quotation

```
Quotation List

↓

Quotation View

↓

Edit Quotation
```

---

# Quotation List Page

Improve similar to the new Enquiry page.

---

## Compact Header

```
Dashboard > Quotations

Quotation Management

Manage customer quotations, revisions and approvals.

                           + Create Quotation
```

---

## Dashboard Cards

Small height cards.

```
-----------------------------------------

Draft

6

-----------------------------------------

Sent

10

-----------------------------------------

Approved

22

-----------------------------------------

Rejected

3

-----------------------------------------

Revenue

₹3,42,000

-----------------------------------------
```

Each card should apply filter when clicked.

---

## Compact Filter Bar

Single line.

```
Search

Status

Source

Date

Customer

Assigned User

Reset

Search
```

---

## Data Table

```
Quotation No

Customer

Event

Amount

Revision

Status

Quotation Date

Actions
```

Hover row

Cursor Pointer

Entire row clickable.

---

# Row Click Behaviour

Current

```
Click Row

↓

Open Enquiry
```

Remove this behaviour.

---

Expected

```
Click Row

↓

Quotation Details Page
```

---

# Quotation View Page

This should be a dedicated page.

Layout

```
------------------------------------------------------

Quotation Header

Quotation Number

Status

Revision

Created Date

Buttons

Edit

Download PDF

WhatsApp

Create Revision

Convert to Order

------------------------------------------------------

Customer Information

------------------------------------------------------

Event Information

------------------------------------------------------

Quotation Line Items

------------------------------------------------------

Amount Summary

Subtotal

Discount

Tax

Grand Total

------------------------------------------------------

Notes

Terms & Conditions

------------------------------------------------------
```

---

# Header

```
Quotation #QTN-2026-00021

Approved

Version 3

Created

27 Jul 2026

----------------------------------------

Edit

Download PDF

WhatsApp

Create Revision

Convert To Order
```

---

# Customer Card

```
Customer

Avatar

Meshak

Phone

Email

Address
```

---

# Event Card

```
Wedding

Hall

Function Date

Guests

Event Time
```

---

# Line Items

Display in invoice style.

```
--------------------------------------------------

Item

Qty

Rate

Subtotal

--------------------------------------------------

Chair

100

₹40

₹4,000

--------------------------------------------------

Stage Decoration

1

₹8,000

₹8,000

--------------------------------------------------
```

Sticky header.

---

# Amount Summary

Right aligned.

```
Subtotal

₹18,000

Discount

₹500

Tax

₹0

Grand Total

₹17,500
```

Large bold amount.

---

# Notes Section

```
Customer Notes

Special Instructions

Terms & Conditions
```

---

# Attachments

Display uploaded files.

```
📄 Quotation.pdf

📷 Images

📑 Supporting Documents
```

---

# Activity Timeline

Right side.

```
Created

Shared via WhatsApp

Downloaded

Approved

Revision Created
```

Shows user and timestamp.

---

# Action Buttons

Top Right

```
Edit Quotation

Download PDF

Send WhatsApp

Create Revision

Convert To Order
```

Primary button

Blue

Secondary

White outline

Danger

Red

---

# More Actions Menu

```
Duplicate

Archive

Delete

Print

Share Link
```

---

# Edit Quotation

Click

```
Edit
```

opens

```
Quotation Edit Page
```

NOT popup.

---

# Edit Enquiry

Sometimes users need to modify enquiry information.

Add button

```
Edit Enquiry
```

Behaviour

```
Quotation View

↓

Edit Enquiry

↓

Open Enquiry Edit Page

↓

Save

↓

Return To Quotation View
```

Do not mix enquiry fields inside quotation edit.

---

# Create Quotation

Header button

```
+ Create Quotation
```

Opens quotation creation page.

Customer can be selected from

- Existing enquiry
- Existing customer
- Manual quotation (without enquiry)

---

# Breadcrumb

```
Dashboard

>

Quotations

>

QTN-2026-00021
```

---

# UX Improvements

- Entire row clickable
- Sticky action bar while scrolling
- Sticky amount summary on large screens
- PDF preview modal
- WhatsApp send confirmation
- Revision history drawer
- Keyboard shortcut for Edit (E)
- Skeleton loading while fetching quotation
- Copy quotation number button
- Copy customer phone button
- Click phone number to call (mobile)
- Click email to compose mail

---

# Expected User Flow

```
Enquiry

↓

Create Quotation

↓

Quotation List

↓

Click Row

↓

Quotation View

↓

Edit Quotation
        OR
Edit Enquiry
        OR
Download PDF
        OR
Share WhatsApp
        OR
Create Revision
        OR
Convert To Order
```

---

# Benefits

- Clear separation between Enquiries and Quotations.
- Faster access to quotation details.
- More intuitive navigation.
- Professional ERP workflow similar to Zoho Books and ERPNext.
- Reduces unnecessary navigation back to the enquiry module.
- Provides a dedicated quotation workspace with all related actions in one place.