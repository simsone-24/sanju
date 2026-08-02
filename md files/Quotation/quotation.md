# Quotation Module
Version: 1.0
Project: Event Management Portal

---

# Purpose

The quotation module is used to prepare professional quotations for customers.

A quotation can be created from

1. Enquiry Module
2. Quotation Module
3. Orders Module

One customer can have multiple quotations.

Example

Customer
    |
    |----Quotation 1
    |----Quotation 2
    |----Quotation 3

Only one quotation may become an Order.

---

# Quotation Creation Sources

There are three ways to create quotations.

--------------------------------------------
1. From Enquiry
--------------------------------------------

Flow

Enquiry
      ↓
Create Quotation
      ↓
Customer details automatically loaded
      ↓
User creates quotation
      ↓
Save
      ↓
Download PDF
      ↓
Send WhatsApp

The quotation is linked with

- Enquiry
- Customer

--------------------------------------------
2. From Quotation Module
--------------------------------------------

The quotation module supports TWO creation modes.

Mode A
-------

Create quotation for existing customer.

Flow

Quotation
      ↓
Select Customer
      ↓
Customer Details Auto Fill
      ↓
Create Quotation
      ↓
Save

Mode B
-------

Manual Quotation

Purpose

Sometimes customers contact through phone or WhatsApp.

The company wants to send quotation immediately without creating customer.

Flow

Quotation
      ↓
Create Manual Quotation
      ↓
No customer selected
      ↓
Enter Customer Name (Optional)
Enter WhatsApp Number
Create Quotation
Save
Download
Send WhatsApp

Manual quotations are NOT linked to Customer.

--------------------------------------------
3. From Orders Module
--------------------------------------------

Existing order/customer

↓

Create quotation

↓

Customer auto loaded

↓

Save quotation

Useful for

Updated quotation

Additional decoration quotation

Revised quotation

---

# Database Relationship

Customer

1 Customer
      |
      |
      +------Many Quotations

Enquiry

1 Enquiry
      |
      |
      +------Many Quotations

Order

1 Order
      |
      |
      +------Many Quotations

Quotation

Can belong to

Customer

OR

Enquiry

OR

Order

OR

Manual

---

# Quotation Status

Draft

Quotation is still editing.

Saved

Quotation completed.

Sent

Quotation sent to customer.

Viewed

Customer viewed quotation (Future Feature).

Accepted

Customer accepted quotation.

Rejected

Customer rejected quotation.

Expired

Quotation validity expired.

Converted

Quotation converted into Order.

---

# Quotation Number

Auto Generated

Example

QTN-2026-0001

QTN-2026-0002

QTN-2026-0003

Unique.

Cannot edit.

---

# Quotation Form

Section 1
----------

Quotation Information

Quotation No

Quotation Date

Validity Date

Status

Source

Created By

Customer

Enquiry

Order

Remarks

---------------------------------------

Section 2

Customer Information

If customer selected

Auto Fill

Customer Name

Phone

Email

Address

GST Number

If Manual

Editable

Customer Name

Phone

Email

Address

GST

---------------------------------------

Section 3

Company Details

(Read Only)

Company Logo

Company Name

Company Address

GST

Email

Website

Phone

These details are loaded from Company Settings.

---------------------------------------

Section 4

Bank Details

(Read Only)

Bank Name

Account Name

Account Number

Branch

IFSC

UPI

Loaded from Company Settings.

---------------------------------------

Section 5

Quotation Items

Table

Item

Description

Unit

Quantity

Unit Price

Discount %

GST %

Total

Buttons

Add Item

Delete Item

Duplicate Item

Live Total Calculation.

---

Section 6

Charges

Transportation

Labour

Extra Charges

Discount

CGST

SGST

Grand Total

Automatically calculated.

---

Section 7

Terms & Conditions

Payment Terms

Delivery Terms

Validity

Additional Notes

Signature

---

# Live Preview

The right side of the page displays

Professional quotation preview.

Exactly like printed PDF.

Whenever user edits

Item

Quantity

Price

Discount

GST

Customer

The preview updates instantly.

No refresh required.

---

# Save Flow

User clicks Save

↓

Validate

↓

Generate Quotation Number

↓

Store Database

↓

Generate PDF

↓

Return Success

Buttons enabled

Download PDF

Print

Share WhatsApp

Duplicate

Convert to Order

---

# PDF Layout

The PDF should exactly match company quotation.

Top

Company Logo

Company Name

Quotation Title

Quotation Number

Quotation Date

Customer Details

Item Table

Totals

Taxes

Discount

Bank Details

Terms

Footer

Thank You Message

Professional A4 Layout.

---

# WhatsApp Integration

After Save

Buttons

Download PDF

Print

WhatsApp

Email (Future)

If customer exists

Use Customer Mobile Number.

If Manual quotation

Show

WhatsApp Number

Input Box

Send Button

Flow

Generate PDF

↓

Upload temporarily

↓

Open WhatsApp

↓

Attach quotation PDF

↓

Default Message

Example

Hello {{Customer Name}}

Thank you for contacting us.

Please find attached our quotation.

Regards

SANJU EVENTS & DECORATION

User selects the contact in WhatsApp Web or App if using click-to-chat. For full automation (sending PDF without manual selection), integrate the WhatsApp Business API.

---

# Quotation Actions

View

Edit

Duplicate

Print

Download PDF

Share WhatsApp

Convert To Order

Delete

View History

---

# Quotation List

Columns

Quotation No

Customer

Phone

Source

Quotation Date

Validity

Total

Status

Created By

Actions

Filters

Date

Customer

Status

Source

Amount

Created User

Search

Quotation Number

Customer

Phone

Item

---

# Company Settings

Admin can configure

Logo

Company Name

Address

GST

Email

Phone

Website

Bank Details

Authorized Signature

Footer Message

These settings automatically appear on every quotation.

---

# Future Enhancements

Digital Signature

QR Code

Online Acceptance

Customer Portal

Version History

Email Quotation

Payment Link

Revision History

Multiple Quotation Templates

Custom Themes

Watermark

Duplicate Existing Quotation

Approval Workflow

Analytics Dashboard