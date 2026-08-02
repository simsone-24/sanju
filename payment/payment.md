# Payment Tracker Module

## Module Overview

The **Payment Tracker** is a standalone module that manages all financial transactions for confirmed orders. Once an enquiry is converted to **Order Confirmed**, it is automatically added to the Payment Tracker module. This module helps track the event budget, payments collected, outstanding balance, and payment status throughout the event lifecycle.

---

# Module Flow

```text
Enquiry
    │
    ▼
Quotation
    │
    ▼
Order Confirmed
    │
    ▼
Payment Tracker
```

- Only **Order Confirmed** enquiries will appear in this module.
- The record is automatically created when the order is confirmed.
- The same Order ID is used across all modules.
- No duplicate customer or event records are created.

---

# Payment Tracker Dashboard

Display summary cards at the top of the page.

### Dashboard Cards

- Total Orders
- Pending Payments
- Partial Payments
- Fully Paid Orders
- Total Budget
- Total Amount Collected
- Outstanding Balance

Clicking a card automatically filters the payment list.

---

# Payment Tracker List

## Filters

- Customer
- Event Date
- Payment Status
- Order Status
- This Week
- This Month
- Next Week
- Next Month
- Custom Date Range

---

## Table Columns

| Column | Description |
|---------|-------------|
| Order No | Unique Order Number |
| Customer | Customer Name |
| Event | Event Type |
| Event Date | Scheduled Event Date |
| Order Status | Current Order Status |
| Budget | Total Event Budget |
| Collected | Total Amount Received |
| Balance | Remaining Amount |
| Payment Status | Pending / Partial / Paid |
| Actions | View / Edit |

---

# Payment Status

Available payment statuses:

- Pending
- Advance Paid
- Partial Payment
- Fully Paid

The status is updated automatically based on payments, but authorized users can edit it if required.

---

# View Payment Details

Selecting **View** opens a dedicated payment details page.

## Order Details

- Order Number
- Customer Name
- Mobile Number
- Event Type
- Event Date
- Venue
- Sales Executive

---

## Financial Summary

- Total Budget
- Advance Amount
- Total Collected
- Remaining Balance
- Payment Status

Example

```text
Budget            ₹2,50,000

Collected         ₹1,20,000

Balance           ₹1,30,000

Payment Status    Partial Payment
```

---

# Edit Payment

The **Edit** action allows authorized users to update:

- Budget Amount (if required)
- Collected Amount
- Payment Status
- Remarks / Notes

The system should automatically recalculate the remaining balance whenever the collected amount changes.

---

# Auto Calculation

```text
Balance = Budget - Collected
```

---

# Actions

Each record should provide the following actions:

- View
- Edit

Future enhancements:

- Print Receipt
- Download PDF
- Payment History
- Send Reminder

---

# Business Rules

- Only **Order Confirmed** enquiries are moved to the Payment Tracker.
- Every confirmed order automatically creates a Payment Tracker record.
- The module uses the existing Order ID.
- Budget, collected amount, and balance are always displayed.
- Balance is automatically calculated.
- Payment status should always be visible in the list.
- Authorized users can update payment details through the Edit action.
- The Payment Tracker is an independent module and should not duplicate customer or order information.

---

# Future Enhancements

- Multiple payment transactions
- Payment history timeline
- Receipt generation
- WhatsApp receipt sharing
- Due payment reminders
- Payment analytics dashboard
- Export to Excel/PDF
- Accounting software integration