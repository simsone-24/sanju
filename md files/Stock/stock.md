# Rent Module — Development Specification

## 1. Overview

Develop a completely **independent Rent Module** for the Event Management Portal.

The Rent Module is used when the company gives its decoration/rental items to a **rental person/customer** and needs to:

* Record which items were given.
* Record item quantities.
* Record item-wise rental rates and amounts.
* Monitor returned quantities.
* Support partial returns.
* Identify items that are not returned.
* Track pending quantities.
* Track rental payments.
* Monitor person-wise outstanding amounts.
* Generate rental and payment reports.

### Important

The Rent Module is **NOT linked to**:

* Enquiry
* Quotation
* Order
* Event Booking
* Order Payment

Rent is a completely separate business workflow.

---

# 2. Current Scope

Implement the following:

```text
Rent
├── Dashboard
├── Rental Persons
├── Stock Out
├── Stock Return
├── Payments
└── Reports
```

Do NOT implement physical stock availability in this phase.

### Future Enhancement

The following are intentionally excluded from the current implementation:

* Total physical stock
* Available stock
* Rented stock
* Damaged stock inventory
* Missing stock inventory
* Stock availability checking before Stock Out
* Automatic inventory deduction
* Inventory reservation

The database and architecture should remain extensible so these features can be added later.

---

# 3. Business Workflow

The complete Phase 1 workflow is:

```text
Rental Person
      ↓
Create Stock Out
      ↓
Select Rental Items
      ↓
Enter Quantity + Rental Rate
      ↓
Calculate Item Amount
      ↓
Save Stock Out
      ↓
Monitor Stock Out
      ↓
Customer Returns Items
      ↓
Create Stock Return
      ↓
Calculate Returned + Balance Quantity
      ↓
Determine Return Status
      ↓
Track Payment
      ↓
Monitor Person-wise Outstanding
```

---

# 4. Main Entities

The module contains these primary entities:

```text
Rental Person
Stock Out
Stock Out Item
Stock Return
Stock Return Item
Payment
Rental Item Master
```

Relationship:

```text
Rental Person
    │
    ├── Stock Out
    │       │
    │       └── Stock Out Items
    │
    └── Payments

Stock Out
    │
    └── Stock Returns
             │
             └── Stock Return Items
```

---

# 5. Rental Person

Create a separate Rental Person master.

A rental person can have multiple Stock Out transactions.

## Fields

```text
Name *
Phone *
Email
Address
City
Notes
Status
```

### Status

```text
Active
Inactive
```

### Example

```text
Name: Simone
Phone: 9876543210
City: Chennai
Status: Active
```

### Rules

* Name is required.
* Phone should be validated.
* Inactive persons should not be selectable for new Stock Out transactions.
* Existing historical transactions must remain accessible even if the person becomes inactive.

---

# 6. Rental Item Master

Use the existing item/product master if the project already has a suitable master.

Do not create duplicate item masters unnecessarily.

The Rent Module needs these item properties:

```text
Item ID
Item Name
Category
Unit
Default Rent Rate
Description
Status
```

### Example

```text
Chairs
Tables
Cloths
LED Lights
Sofa
Backdrop
Stage Items
Decorative Props
```

### Important

The current version does NOT maintain physical quantity.

Do not add:

```text
Available Stock
Total Stock
Rented Stock
```

to the current business logic.

Those are future enhancements.

---

# 7. Stock Out

Stock Out is the main Rent transaction.

It works similarly to the quotation item-entry experience, but it is independent from the Quotation module.

## 7.1 Create Stock Out

### Header

```text
Stock Out No       Auto Generated
Rental Person      Required
Stock Out Date     Required
Expected Return    Optional
Notes              Optional
```

### Rental Items

Use a dynamic item table.

| Item   | Quantity | Rate | Amount | Action |
| ------ | -------: | ---: | -----: | ------ |
| Chairs |        5 | ₹100 |   ₹500 | Remove |
| Tables |        3 | ₹250 |   ₹750 | Remove |
| Cloths |        4 | ₹150 |   ₹600 | Remove |

Allow:

* Add Item
* Remove Item
* Change Item
* Change Quantity
* Change Rate

### Item Amount

```text
Amount = Quantity × Rate
```

Example:

```text
5 × ₹100 = ₹500
```

---

# 8. Stock Out Calculation

Display:

```text
Subtotal
Discount
Additional Charges
Grand Total
```

Formula:

```text
Item Amount = Quantity × Rate

Subtotal = Sum of all Item Amounts

Grand Total =
Subtotal
- Discount
+ Additional Charges
```

All calculations must update dynamically when:

* Quantity changes.
* Rate changes.
* Item is added.
* Item is removed.
* Discount changes.
* Additional charges change.

---

# 9. Stock Out Example

```text
Stock Out No: RENT-OUT-0001

Rental Person: Simone
Stock Out Date: 15 Aug 2026
Expected Return: 18 Aug 2026

Items:

Chairs       5 × ₹100 = ₹500
Tables       3 × ₹250 = ₹750
Cloths       4 × ₹150 = ₹600

Subtotal = ₹1,850
Discount = ₹0
Additional Charges = ₹0

Grand Total = ₹1,850
```

After saving, generate a unique Stock Out number.

Example:

```text
RENT-OUT-0001
RENT-OUT-0002
RENT-OUT-0003
```

Use the existing project's numbering convention if one already exists.

---

# 10. Stock Out Status

Stock Out should have a return status.

Do not allow users to manually manipulate this status.

Calculate it based on return quantities.

Possible statuses:

```text
NOT_RETURNED
PARTIAL_RETURNED
RETURNED
```

### NOT_RETURNED

```text
Total Returned = 0
Balance > 0
```

### PARTIAL_RETURNED

```text
Total Returned > 0
Balance > 0
```

### RETURNED

```text
Balance = 0
```

---

# 11. Stock Out List

Create a dedicated Stock Out index page.

## Columns

```text
Stock Out No
Rental Person
Stock Out Date
Expected Return Date
Total Items
Total Amount
Paid Amount
Balance Amount
Return Status
Actions
```

Example:

| Rent No      | Person | Date   | Items | Amount |   Paid | Balance | Return       |
| ------------ | ------ | ------ | ----: | -----: | -----: | ------: | ------------ |
| RENT-OUT-001 | Simone | 15 Aug |    12 | ₹1,850 | ₹1,000 |    ₹850 | Partial      |
| RENT-OUT-002 | Kumar  | 14 Aug |    25 | ₹4,500 | ₹4,500 |      ₹0 | Returned     |
| RENT-OUT-003 | Arun   | 12 Aug |    18 | ₹3,200 |     ₹0 |  ₹3,200 | Not Returned |

## Filters

Implement:

* Rental Person
* Date Range
* Return Status
* Payment Status
* Search by Stock Out Number
* Search by Person Name
* Search by Phone

---

# 12. Stock Out View

Clicking a Stock Out row should open a dedicated View page.

Do NOT open the creation/edit form directly.

## Header

Display:

```text
RENT-OUT-0001

Simone
9876543210

Stock Out Date
Expected Return Date
Return Status
```

## Rental Items

| Item   | Issued Qty | Rate | Amount |
| ------ | ---------: | ---: | -----: |
| Chairs |          5 | ₹100 |   ₹500 |
| Tables |          3 | ₹250 |   ₹750 |
| Cloths |          4 | ₹150 |   ₹600 |

## Financial Summary

```text
Subtotal
Discount
Additional Charges
Grand Total
Paid
Balance
```

## Return Summary

```text
Total Issued
Total Returned
Total Balance
Return Status
```

## Actions

```text
Edit
Return Stock
Add Payment
Print
Download PDF
```

---

# 13. Stock Return

Stock Return is a separate module used to monitor all Stock Out transactions and record returned quantities.

## Stock Return Dashboard

Show:

```text
Total Stock Out
Not Returned
Partial Returned
Returned
Total Issued Items
Total Returned Items
Total Pending Items
```

The cards should be clickable and filter the report.

---

# 14. Stock Return List

Display all Stock Out transactions.

## Columns

```text
Stock Out No
Rental Person
Stock Out Date
Total Issued
Total Returned
Balance
Return Status
Last Return Date
Actions
```

Example:

| Rent No  | Person | Issued | Returned | Balance | Status           |
| -------- | ------ | -----: | -------: | ------: | ---------------- |
| RENT-001 | Simone |     12 |        8 |       4 | Partial Returned |
| RENT-002 | Kumar  |     25 |       25 |       0 | Returned         |
| RENT-003 | Arun   |     18 |        0 |      18 | Not Returned     |

---

# 15. Return Stock Entry

When the user clicks `Return Stock`, show all Stock Out items.

Example:

| Item   | Issued | Previously Returned | Current Return | Balance |
| ------ | -----: | ------------------: | -------------: | ------: |
| Chairs |      5 |                   3 |              2 |       0 |
| Tables |      3 |                   3 |              0 |       0 |
| Cloths |      4 |                   2 |              1 |       1 |

The user enters only:

```text
Current Return
```

The system calculates:

```text
Balance =
Issued Quantity
- Previously Returned Quantity
- Current Return Quantity
```

---

# 16. Return Validation

Never allow:

```text
Current Return > Remaining Balance
```

Example:

```text
Issued = 5
Previously Returned = 3
Remaining = 2
```

Maximum Current Return:

```text
2
```

The user cannot enter:

```text
3
4
5
```

Show an appropriate validation message.

---

# 17. Multiple Returns

The system MUST support multiple return transactions for one Stock Out.

Example:

```text
15 Aug
Stock Out = 12 items

17 Aug
Returned = 5

18 Aug
Returned = 3

20 Aug
Returned = 4

Total Returned = 12
Balance = 0

Status = RETURNED
```

Do not store only a single `returned` boolean on Stock Out.

Return history must be preserved.

---

# 18. Return History

Stock Out View should show return history.

Example:

| Return No | Return Date | Returned Items | Notes          |
| --------- | ----------- | -------------: | -------------- |
| RET-001   | 17 Aug      |              5 | First return   |
| RET-002   | 18 Aug      |              3 | Partial return |
| RET-003   | 20 Aug      |              4 | Final return   |

Clicking a return should show its item-level details.

---

# 19. Payment Module

Payments are independent records but connected to:

```text
Rental Person
Stock Out
```

A rental person can have many Stock Out transactions and many payments.

---

# 20. Payment Dashboard

Display:

```text
Total Rental Amount
Total Amount Received
Total Amount Pending
```

Example:

```text
Total Rental Amount     ₹4,50,000
Total Received          ₹3,20,000
Total Pending           ₹1,30,000
```

---

# 21. Payment List

Columns:

```text
Payment No
Rental Person
Stock Out No
Payment Date
Amount
Payment Mode
Reference No
Notes
```

Example:

| Payment No | Person | Rent No  | Date   | Amount | Mode |
| ---------- | ------ | -------- | ------ | -----: | ---- |
| PAY-001    | Simone | RENT-001 | 15 Aug | ₹1,000 | Cash |
| PAY-002    | Kumar  | RENT-002 | 15 Aug | ₹4,500 | UPI  |

---

# 22. Payment Entry

Fields:

```text
Rental Person *
Stock Out *
Payment Date *
Payment Amount *
Payment Mode *
Reference Number
Notes
```

Payment modes:

```text
Cash
UPI
Bank Transfer
Card
Other
```

Display:

```text
Total Amount
Already Paid
Current Balance
```

Do not allow payment amount greater than the outstanding amount unless the existing project has an explicit overpayment/refund workflow.

---

# 23. Payment Calculation

For each Stock Out:

```text
Paid Amount = Sum of related payments

Balance =
Grand Total - Paid Amount
```

Payment status:

```text
UNPAID
PARTIALLY_PAID
PAID
```

### UNPAID

```text
Paid = 0
Balance > 0
```

### PARTIALLY_PAID

```text
Paid > 0
Balance > 0
```

### PAID

```text
Balance = 0
```

Payment status should be calculated automatically.

---

# 24. Person-wise Payment Monitoring

This is an important feature.

Create a rental person payment summary.

| Rental Person | Stock Outs | Total Amount |    Paid | Pending |
| ------------- | ---------: | -----------: | ------: | ------: |
| Simone        |          8 |      ₹25,000 | ₹20,000 |  ₹5,000 |
| Kumar         |          5 |      ₹18,500 | ₹18,500 |      ₹0 |
| Arun          |          4 |      ₹12,000 |  ₹7,000 |  ₹5,000 |

Clicking a person should show:

```text
Rental Person: Simone

Total Rental Amount
Total Paid
Total Pending
```

Then show all Stock Out transactions and payment history.

---

# 25. Payment History

For each Stock Out:

```text
Total Amount: ₹1,850
Paid: ₹1,500
Balance: ₹350
```

Payment history:

| Date   | Amount | Mode | Reference | Notes   |
| ------ | -----: | ---- | --------- | ------- |
| 10 Aug | ₹1,000 | Cash | -         | Advance |
| 15 Aug |   ₹500 | UPI  | UPI123    | Partial |

---

# 26. Rent Dashboard

Dashboard should combine the major monitoring information.

## Return Cards

```text
Total Stock Out
Not Returned
Partial Returned
Returned
```

## Payment Cards

```text
Total Rental Amount
Total Received
Total Pending
```

## Recent Stock Out

Show latest transactions.

## Pending Returns

Show transactions where:

```text
Return Status = NOT_RETURNED
OR
Return Status = PARTIAL_RETURNED
```

## Pending Payments

Show transactions/persons where:

```text
Balance > 0
```

---

# 27. Reports

Create the following reports.

## Stock Out Report

Filters:

* Date range
* Rental Person
* Item
* Stock Out Number

Display:

```text
Stock Out No
Person
Date
Items
Quantity
Amount
```

---

## Stock Return Report

Filters:

* Date range
* Rental Person
* Return Status
* Item

Display:

```text
Stock Out No
Person
Issued
Returned
Balance
Status
```

---

## Pending Return Report

Only show:

```text
NOT_RETURNED
PARTIAL_RETURNED
```

Display:

```text
Person
Stock Out No
Item
Issued
Returned
Balance
Expected Return Date
```

---

## Payment Report

Filters:

* Date range
* Rental Person
* Payment Mode
* Payment Status

Display:

```text
Person
Stock Out
Total Amount
Paid
Balance
Payment Status
```

---

## Person-wise Report

Display:

```text
Rental Person
Number of Stock Outs
Total Rental Amount
Total Paid
Total Pending
Returned Transactions
Pending Returns
```

---

# 28. Database Design

Use relational database design.

## rental_persons

```text
id
name
phone
email
address
city
notes
status
created_at
updated_at
```

---

## stock_outs

```text
id
rent_no
rental_person_id
stock_out_date
expected_return_date
subtotal
discount
additional_charges
grand_total
notes
created_at
updated_at
```

Do not store manually editable:

```text
paid_amount
balance_amount
return_status
```

These should preferably be calculated from related records.

If the existing architecture requires cached values, ensure they are updated transactionally.

---

## stock_out_items

```text
id
stock_out_id
item_id
item_name_snapshot
quantity
rate
amount
created_at
updated_at
```

### Important

Store the item name snapshot so historical rental documents remain correct if the master item name changes later.

---

## stock_returns

```text
id
return_no
stock_out_id
return_date
notes
created_at
updated_at
```

---

## stock_return_items

```text
id
stock_return_id
stock_out_item_id
quantity_returned
created_at
updated_at
```

This structure allows multiple return transactions.

---

## payments

```text
id
payment_no
stock_out_id
rental_person_id
payment_date
amount
payment_mode
reference_no
notes
created_at
updated_at
```

---

# 29. Database Relationships

```text
rental_persons
       │
       ├───────────────┐
       │               │
       ▼               ▼
 stock_outs         payments
       │
       ▼
stock_out_items
       │
       ▼
stock_return_items
       ▲
       │
stock_returns
```

Relationships:

```text
RentalPerson 1 ──── N StockOut

StockOut 1 ──── N StockOutItems

StockOut 1 ──── N StockReturns

StockReturn 1 ──── N StockReturnItems

StockOutItem 1 ──── N StockReturnItems

StockOut 1 ──── N Payments

RentalPerson 1 ──── N Payments
```

---

# 30. API Structure

Follow the existing backend architecture and naming conventions.

Suggested endpoints:

## Rental Persons

```http
GET    /api/rent/persons
GET    /api/rent/persons/:id
POST   /api/rent/persons
PUT    /api/rent/persons/:id
DELETE /api/rent/persons/:id
```

## Stock Out

```http
GET    /api/rent/stock-outs
GET    /api/rent/stock-outs/:id
POST   /api/rent/stock-outs
PUT    /api/rent/stock-outs/:id
DELETE /api/rent/stock-outs/:id
```

## Stock Return

```http
GET  /api/rent/returns
GET  /api/rent/returns/:id
POST /api/rent/stock-outs/:id/returns
```

## Payments

```http
GET    /api/rent/payments
GET    /api/rent/payments/:id
POST   /api/rent/payments
PUT    /api/rent/payments/:id
DELETE /api/rent/payments/:id
```

## Dashboard

```http
GET /api/rent/dashboard
```

## Reports

```http
GET /api/rent/reports/stock-out
GET /api/rent/reports/returns
GET /api/rent/reports/pending-returns
GET /api/rent/reports/payments
GET /api/rent/reports/person-summary
```

Use the project's existing API response format, error handling, authentication, validation, pagination, and service/repository patterns instead of introducing a different architecture.

---

# 31. Transaction Safety

Stock Out creation should be performed inside a database transaction.

The transaction should create:

```text
Stock Out
+
Stock Out Items
```

together.

Payment creation should ensure the payment belongs to the selected Stock Out and Rental Person.

Return creation should create:

```text
Stock Return
+
Stock Return Items
```

atomically.

If any part fails, rollback the complete operation.

---

# 32. Edit Rules

Stock Out can be edited according to existing portal permissions.

However, take care with transactions that already have returns or payments.

Recommended rule:

### No Return + No Payment

Allow normal editing.

### Has Payment

Allow editing only fields that do not invalidate existing payment records.

### Has Return

Do not allow changing:

* Item
* Original quantity

without a controlled adjustment process.

This prevents return calculations from becoming inconsistent.

---

# 33. Delete Rules

Do not hard-delete transactions that already contain:

* Returns
* Payments

Recommended:

```text
Active
Cancelled
```

or use the project's existing soft-delete mechanism.

Historical financial and return records should remain auditable.

---

# 34. UI/UX Requirements

Follow the existing Event Management Portal design system.

The Rent Module should feel consistent with:

* Enquiry
* Quotation
* Order
* Payment
* Master modules

Use:

* Consistent page headers
* Dashboard cards
* Data tables
* Search
* Filters
* Status badges
* Confirmation dialogs
* Toast notifications
* Empty states
* Loading states
* Error states
* Responsive layout

---

# 35. Status Badge Design

Use clear visual status badges.

```text
NOT RETURNED
PARTIAL RETURNED
RETURNED

UNPAID
PARTIALLY PAID
PAID
```

Do not rely only on color.

The text must always be visible.

---

# 36. Important Business Rules

### Rule 1

Rent is completely independent from Enquiry and Order.

### Rule 2

A Rental Person can have multiple Stock Outs.

### Rule 3

A Stock Out can contain multiple items.

### Rule 4

Each item has its own quantity and rental rate.

### Rule 5

Amount is:

```text
Quantity × Rate
```

### Rule 6

A Stock Out can have multiple Return transactions.

### Rule 7

Partial returns are supported.

### Rule 8

Returned quantity cannot exceed the remaining quantity.

### Rule 9

Return status is automatically calculated.

### Rule 10

Payment status is automatically calculated.

### Rule 11

A person can have multiple payments.

### Rule 12

Payment balance is:

```text
Grand Total - Total Payments
```

### Rule 13

Historical transactions must remain accurate if master data changes.

### Rule 14

Current Phase 1 does NOT calculate physical stock availability.

---

# 37. Future Stock Availability Enhancement

Design the system so the following can be added later.

Future item inventory:

```text
Rental Item
│
├── Total Stock
├── Available Stock
├── Rented Stock
├── Damaged Stock
└── Missing Stock
```

Future flow:

```text
Total Stock
      ↓
Available Stock
      ↓
Stock Out
      ↓
Rented Stock
      ↓
Stock Return
      ↓
Available Stock
```

Future Stock Out validation:

```text
Requested Quantity
       ↓
Available Quantity
       ↓
If Available >= Requested
       ↓
Allow Stock Out
```

This must NOT be implemented in the current phase.

---

# 38. Development Order

Implement in this order:

## Step 1 — Database

* Rental Person
* Stock Out
* Stock Out Items
* Stock Return
* Stock Return Items
* Payments
* Relationships
* Indexes
* Constraints

## Step 2 — Backend

* Rental Person CRUD
* Stock Out CRUD
* Return APIs
* Payment APIs
* Dashboard APIs
* Report APIs
* Validation
* Transactions
* Permission checks

## Step 3 — Frontend

### Rental Person

* List
* Create
* Edit
* View

### Stock Out

* List
* Create
* Edit
* View

### Stock Return

* Dashboard
* List
* Return entry
* Return history
* View

### Payments

* Dashboard
* List
* Add Payment
* Payment history
* Person summary

### Reports

* Stock Out
* Return
* Pending Return
* Payment
* Person-wise

## Step 4 — Testing

Test:

* Create Rental Person
* Create Stock Out
* Multiple items
* Quantity changes
* Rate changes
* Discount
* Additional charges
* Edit Stock Out
* Full Return
* Partial Return
* Multiple Returns
* Invalid Return Quantity
* Payment
* Multiple Payments
* Full Payment
* Partial Payment
* Person-wise outstanding
* Filters
* Pagination
* Permissions
* Delete/cancel rules

---

# 39. Acceptance Criteria

The Rent Module is complete when:

* [ ] Rent works independently from Enquiry and Orders.
* [ ] Rental Persons can be created and managed.
* [ ] Stock Out can be created.
* [ ] Multiple rental items can be added.
* [ ] Quantity and rate are editable.
* [ ] Item amount is calculated automatically.
* [ ] Grand total is calculated correctly.
* [ ] Stock Out can be viewed after creation.
* [ ] Stock Out can be edited according to business rules.
* [ ] Stock Return lists all Stock Out transactions.
* [ ] Full return is supported.
* [ ] Partial return is supported.
* [ ] Multiple return transactions are supported.
* [ ] Returned quantity cannot exceed remaining quantity.
* [ ] Balance quantity is calculated automatically.
* [ ] Return status is calculated automatically.
* [ ] Payments can be recorded.
* [ ] Multiple payments are supported.
* [ ] Payment status is calculated automatically.
* [ ] Person-wise payment monitoring works.
* [ ] Pending payment can be identified.
* [ ] Pending return can be identified.
* [ ] Dashboard counts are accurate.
* [ ] Reports support required filters.
* [ ] RBAC permissions are applied.
* [ ] Historical records remain consistent.
* [ ] Physical stock availability is NOT implemented in Phase 1.
* [ ] Architecture is ready for future stock availability enhancement.

---

# 40. Final Module Structure

```text
RENT
│
├── Dashboard
│   ├── Total Stock Out
│   ├── Not Returned
│   ├── Partial Returned
│   ├── Returned
│   ├── Total Rental Amount
│   ├── Total Paid
│   └── Total Pending
│
├── Rental Persons
│   ├── List
│   ├── Create
│   ├── Edit
│   └── View
│
├── Stock Out
│   ├── List
│   ├── Create
│   ├── Edit
│   └── View
│
├── Stock Return
│   ├── Dashboard
│   ├── List
│   ├── Return Stock
│   ├── Return History
│   └── View
│
├── Payments
│   ├── Dashboard
│   ├── List
│   ├── Add Payment
│   ├── Payment History
│   └── Person Summary
│
└── Reports
    ├── Stock Out Report
    ├── Stock Return Report
    ├── Pending Return Report
    ├── Payment Report
    └── Person-wise Report
```

**Implementation priority:** Build the complete Phase 1 workflow first. Do not introduce physical stock availability logic until the Rent transaction, return, and payment workflows are stable and tested.
