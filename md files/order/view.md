# Order Details Page UI Enhancement

## Objective

Redesign the Order Details page into a premium CRM-style interface where users can quickly understand the order status and access important information without navigating multiple tabs.

---

# Header Section

Replace the current large empty header with an Order Summary Card.

------------------------------------------------------------

Dashboard > Orders > ORD-2026-00001

ORD-2026-00001

Wedding Decoration Order

Customer : Simsone

Created : 20 Jul 2026

Event : Wedding

Event Date : 15 Aug 2026

Venue : Coimbatore

Status : CONFIRMED

------------------------------------------------------------

Right Side

Estimated Amount

₹2,50,000

Paid

₹1,50,000

Balance

₹1,00,000

------------------------------------------------------------

Buttons

Edit Order

Print

Download PDF

Share WhatsApp

---

# Quick Progress Tracker

Display below the summary card.

Planning Created
        │
        ▼
Work Started
        │
        ▼
Event Completed

Current stage highlighted.

Cancelled should appear separately in red.

---

# Tabs

Event Information

Quotation

Payments

Planning

Task Checklist

Documents

Timeline

Only improve Event Information and Quotation tabs now.

---

# Event Information Tab

Instead of a plain form, divide into cards.

## Card 1

Customer Information

--------------------------------

Customer Name

Mobile

Email

Address

Customer Since

--------------------------------

## Card 2

Event Information

--------------------------------

Event Name

Event Date

Venue

Guest Count

Theme

Event Manager

--------------------------------

## Card 3

Payment Summary

--------------------------------

Quotation Amount

Paid

Balance

Advance %

--------------------------------

Display the payment summary as colorful statistic cards.

---

# Quotation Tab

Current UI

Empty

Expected

-----------------------------------------------------

Confirmed Quotation

Quotation No

QT-2026-00012

Status

Confirmed

Created

20 Jul 2026

Total

₹2,50,000

-----------------------------------------------------

Buttons

👁 View Quotation

⬇ Download PDF

🖨 Print

📱 Share WhatsApp

✉ Email

-----------------------------------------------------

## View Quotation

When user clicks

View Quotation

Open the quotation in one of the following:

Preferred

Right-side Drawer

OR

Modal (Large)

without navigating away.

Inside the quotation viewer

----------------------------------------------------

Company Logo

Quotation Number

Customer Details

Event Details

Items Table

Item

Qty

Unit Price

Amount

-----------------------------------

Decoration

1

₹80,000

₹80,000

Lighting

1

₹30,000

₹30,000

Sound

1

₹20,000

₹20,000

-----------------------------------

Subtotal

Discount

Grand Total

Bank Details

Terms & Conditions

----------------------------------------------------

Bottom Buttons

Download PDF

Print

Share WhatsApp

Close

---

If no quotation exists

Show illustration

"No confirmed quotation available."

Button

Create Quotation

---

# Planning Tab

Current page is mostly empty.

Instead of

No planning tasks yet.

Display

------------------------------------------------

Planning Overview

Progress

0%

Tasks

0

Completed

0

Pending

0

------------------------------------------------

Below

Empty Illustration

No planning tasks have been created.

Button

+ Create Planning Task

---

# Design Improvements

Use modern cards.

Rounded corners (16px)

Soft shadows

Proper spacing

Status badges

Timeline icons

Hover animations

Responsive layout

Sticky tabs

Gradient summary card

Use icon for every information block.

---

# User Experience

User should understand

Order

Customer

Quotation

Payment

Current Stage

within 5 seconds of opening the page.

The quotation should be accessible in one click without opening another page.

Planning should immediately encourage users to start creating tasks instead of displaying only plain text.
