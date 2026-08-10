# Enquiry Module - Business Logic & Development Prompt

## Objective

The Enquiry Module is the central customer enquiry management module. Its primary purpose is to track every customer enquiry from the initial contact until the enquiry is completed, lost, or converted into a confirmed order.

Use the existing enquiry fields and database structure. Do not remove or redesign existing enquiry data unless necessary for technical improvements.

---

# Core Principles

## 1. Enquiry is Independent

An enquiry should always exist independently.

- Creating a quotation must NOT change the enquiry status automatically.
- Deleting or editing a quotation must NOT affect the enquiry.
- Multiple quotations belong to one enquiry.
- The enquiry acts as the parent record.

Relationship

Enquiry (1)
    ├── Quotation 1
    ├── Quotation 2
    ├── Quotation 3
    └── ...

---

# 2. Multiple Quotations

A single enquiry can have unlimited quotations.

Example

Customer Enquiry

Quotation V1 - ₹1,20,000
Quotation V2 - ₹1,45,000
Quotation V3 - ₹1,35,000

There is NO restriction on:

- Number of quotations
- Editing quotations
- Creating new quotations
- Changing quotation status
- Confirming any quotation

Users can create a quotation whenever required.

---

# 3. Quotation Status

Every quotation maintains its own status.

Example statuses

- Draft
- Sent
- Viewed
- Under Discussion
- Revised
- Accepted
- Rejected
- Expired
- Cancelled

Changing quotation status must NOT automatically change enquiry status.

---

# 4. Enquiry Status

Enquiry status is completely independent.

Example

- New
- Contacted
- Appointment Scheduled
- Follow Up
- Negotiation
- Order Confirmed
- Order Lost
- Closed

Users can change enquiry status at any time.

No validation should force quotation status before changing enquiry status.

---

# 5. Order Confirmation

When a customer accepts one quotation,

User manually selects

"Confirm Quotation"

System should

• Mark selected quotation as Confirmed/Accepted
• Convert enquiry into Order Confirmed
• Create Order record
• Move Order into Payment Tracker (existing flow)

Other quotations remain available for history.

---

# 6. Editing Rules

Users can edit

✓ Enquiry
✓ Quotation
✓ Quotation Status
✓ Enquiry Status

at any stage according to user permissions.

No locking after quotation creation.

No locking after quotation confirmation unless future business rules require it.

---

# 7. No Restrictions

The system must NOT enforce rules such as

❌ Only one quotation allowed

❌ Cannot create quotation after sending one

❌ Cannot edit quotation after sending

❌ Cannot change enquiry status

❌ Cannot create quotation after appointment

❌ Cannot create quotation after follow-up

❌ Cannot edit quotation after discussion

Instead

Users have full flexibility.

Business processes vary, so the software must support changes at any time.

---

# 8. Enquiry Timeline

Maintain a complete history.

Examples

Enquiry Created

↓

Appointment Scheduled

↓

Quotation V1 Created

↓

Quotation Sent

↓

Quotation Revised

↓

Quotation V2 Created

↓

Customer Negotiation

↓

Quotation V2 Confirmed

↓

Order Created

↓

Payment Tracking

Every activity should be logged in the enquiry timeline.

---

# 9. UI Requirements

Enquiry Detail Page should display

## Customer Information

- Existing enquiry fields

## Enquiry Status

Editable

## Quotations

Table

- Quotation No
- Version
- Date
- Amount
- Status
- Last Updated
- Actions
    - View
    - Edit
    - Duplicate
    - Download PDF
    - Send WhatsApp
    - Confirm

Top actions

- Create New Quotation
- Edit Enquiry
- Change Enquiry Status

---

# 10. Business Flow

Customer Enquiry

↓

Create Quotation

↓

Edit Quotation

↓

Create Another Quotation

↓

Send Multiple Revisions

↓

Customer Accepts One Quotation

↓

User Confirms Selected Quotation

↓

Enquiry Status → Order Confirmed

↓

Order Module

↓

Payment Tracker

---

# Expected System Behavior

- Enquiry is the parent record.
- Unlimited quotations can be created for an enquiry.
- Quotation status and enquiry status are managed independently.
- Users can edit enquiries and quotations at any stage (subject to permissions).
- No automatic restrictions should block quotation creation, editing, or status changes.
- Only when a quotation is manually confirmed should the enquiry be converted into an order and continue through the Order and Payment Tracker workflow.