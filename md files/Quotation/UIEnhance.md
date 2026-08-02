# Quotation Module - Field Rearrangement & UI Enhancement
Version: 1.1

---

# Objective

Simplify the quotation creation screen and make it faster for daily use.

The quotation page should be clean, user-friendly, and require minimal clicks.

---

# Required Changes

## 1. Search Enquiry Dropdown

### Current
Customer is selected separately.

### Expected

Replace the customer selection with a **Search Enquiry** dropdown.

Features

- Searchable dropdown
- Load all existing enquiries
- Search by
  - Enquiry Number
  - Customer Name
  - Mobile Number
- Selecting an enquiry automatically fills
  - Customer Name
  - Mobile Number
  - Address (if available)

Example

Search Enquiry

```
Search...

ENQ00021 - Aravind - 9876543210

ENQ00045 - Kumar - 9898989898

ENQ00078 - Bala - 9123456789
```

No manual customer selection required.

---

## 2. Quotation Date

### Expected

Quotation Date should automatically display today's date.

Example

Quotation Date

02/02/2026

The user can change the date if required.

---

## 3. Line Items UI

### Current

Items are added one by one using individual fields.

This is slow.

---

### Expected

Items should be entered in a table format.

Example

| Item | Quantity | Unit Price | Sub Total |
|------|---------:|-----------:|----------:|
| Chairs | 10 | 50 | 500 |
| Tables | 5 | 250 | 1250 |
| Wash Basin | 2 | 1000 | 2000 |

---

### Table Features

Columns

- Item
- Quantity
- Unit Price
- Sub Total

Sub Total should calculate automatically.

Formula

```
Quantity × Unit Price
```

Example

```
10 × 50

=

500
```

---

## 4. Auto Add Next Row

Current

User clicks Add Item button every time.

Expected

When the user completes the current row and presses

- Enter
- Tab
- Down Arrow

Automatically create the next empty row.

Example

```
Row 1 Completed

↓

Automatically

Row 2 Created

↓

User Starts Typing

↓

Row 3 Created
```

No Add Item button required.

This makes data entry much faster.

---

## 5. Remove Unnecessary Fields

Remove the following fields from the quotation form.

- GST %
- CGST
- SGST
- Tax Calculation
- Discount
- Manual Total Fields
- Extra Charge Fields

The quotation should only calculate the total amount based on item subtotals.

---

## 6. Total Calculation

Expected

Only calculate

```
Grand Total

=

Sum of all Item Sub Totals
```

Example

| Item | Sub Total |
|------|----------:|
| Chairs | 500 |
| Table | 1250 |
| Photography | 10000 |

Grand Total

```
500

+

1250

+

10000

=

11750
```

No GST calculation.

No CGST.

No SGST.

No Discount.

---

## 7. Page Layout

The quotation page should have a clean two-column layout.

```
----------------------------------------------------------

Quotation Details          Live Preview

------------------         -----------------------------

Search Enquiry             PDF Preview

Quotation Date

Items Table

Grand Total

Save

Download

Send WhatsApp

                            Company Template Preview

----------------------------------------------------------
```

---

## 8. Live Preview

The quotation preview should update instantly whenever the user changes

- Item
- Quantity
- Unit Price
- Total
- Customer

No refresh required.

---

## 9. Action Buttons

Display buttons after saving.

- Save
- Download PDF
- Print
- Send WhatsApp

---

## 10. User Experience Improvements

Use a professional modern UI.

Recommended

- Rounded input fields
- Sticky table header
- Alternate row colors
- Responsive layout
- Large Save button
- Auto focus next input
- Keyboard-friendly navigation
- Real-time calculations
- Smooth animations
- Better spacing and alignment

---

# Final Screen Structure

```
------------------------------------------------------------

Quotation

------------------------------------------------------------

Search Enquiry

[ Search Existing Enquiry ]

Quotation Date

[ Today's Date ]

------------------------------------------------------------

Items

------------------------------------------------------------

| Item | Qty | Unit Price | Sub Total |

|------|----:|-----------:|----------:|

|      |     |            |           |

|      |     |            |           |

|      |     |            |           |

------------------------------------------------------------

Grand Total

₹ 78,500

------------------------------------------------------------

Save

Download PDF

Send WhatsApp

------------------------------------------------------------

Live Preview

(A4 Quotation Template)

------------------------------------------------------------
```

---

# Expected Result

- Faster quotation creation
- Minimal user interaction
- Cleaner interface
- Keyboard-friendly data entry
- Professional quotation experience
- Improved productivity for office staff
- Modern and user-friendly design