# Enquiry Module — Flow Documentation

## 1. Overview

The Enquiry module captures customer details, an optional appointment, and an
optional quotation. It also controls how an enquiry can transition into
**Order Confirmed** status, enforcing that a valid, approved quotation exists
before that transition is allowed.

---

## 2. Enquiry Creation Flow

### 2.1 Customer Details

- User enters customer details manually (New Customer), **or**
- User selects **Existing User**:
  - System auto-fills the customer's basic details (name, contact number,
    email, address, etc.) from the existing customer record.
  - Auto-filled fields remain editable unless explicitly locked by business
    rule.

### 2.2 Appointment Section

- Appointment details are **optional**.
- User may skip this section entirely and proceed to Quotation / Save.
- No validation error should be raised if the Appointment section is left
  empty.

### 2.3 Quotation Section

- User clicks **Create Quotation**.
- Behavior:
  - The current page **does not reload / does not navigate away** — i.e. no
    full page load is triggered on click (handled via modal / inline
    component / AJAX-style transition, consistent with existing
    implementation pattern).
  - The **existing Quotation creation flow** is reused as-is (same fields,
    same validations, same save logic already implemented elsewhere in the
    system). No new/duplicate quotation logic is introduced.
  - There is **no restriction** on saving the quotation from this screen —
    it can be saved regardless of enquiry status, completeness of other
    sections, etc.
- **After Save:**
  - User is redirected to the **Enquiry List** page.

---

## 3. Enquiry Status Transition — "Order Confirmed"

This rule applies whenever the user tries to move an enquiry's status
**directly to `Order Confirmed`** — whether:

- Changing the status of an **existing enquiry**, or
- Setting the status while creating/saving a **new enquiry**.

### 3.1 Validation Rules

This check only triggers when the user (on the selected customer's
enquiry) chooses to move the enquiry status **to `Order Confirmed`**. It is
a **confirmation popup only** — not a hard block. The user can read the
message and choose to proceed, confirming the status change anyway.

| Condition | System Behavior |
|---|---|
| No Quotation created for this Enquiry | Show confirm popup: **"This Enquiry hasn't a Quotation. Please confirm before moving status to Order Confirmed."** — user may confirm to proceed. |
| Quotation exists but is **not Approved** | Show confirm popup: **"This Enquiry's Quotation is not approved. Please confirm before moving status to Order Confirmed."** — user may confirm to proceed. |
| Quotation exists **and** is Approved | No popup. Transition to `Order Confirmed` proceeds normally. |

### 3.2 Logic Flow

```
User selects a Customer's Enquiry and sets Status = "Order Confirmed"
        │
        ▼
Does a Quotation exist for this Enquiry?
        │
   ┌────┴────┐
   NO        YES
   │          │
   ▼          ▼
 Show Confirm   Is the Quotation Approved?
 Popup:              │
 "No Quotation   ┌────┴────┐
  found..."       NO        YES
   │              │          │
   ▼              ▼          ▼
 User confirms  Show Confirm   Proceed
   │            Popup:        Status → Order Confirmed
   ▼            "Quotation
 Proceed         not approved..."
 Status →            │
 Order Confirmed      ▼
                  User confirms
                      │
                      ▼
                  Proceed
                  Status → Order Confirmed
```

### 3.3 Notes

- Both checks are independent but sequential: first check **existence** of
  a quotation, then check its **approval status**.
- The popup is a **confirmation message only** — it informs the user of the
  missing pre-condition, but the user can confirm and still proceed with
  the status change to `Order Confirmed`. It does not hard-block the save.
- This popup only appears when the action being performed is specifically
  moving the enquiry status to `Order Confirmed`. It applies uniformly for:
  - Manual status change on an existing enquiry.
  - Direct status selection while creating a new enquiry.

---

## 4. Summary of Confirm Popup Messages

| Scenario | Confirm Popup Message | User can proceed after confirming? |
|---|---|---|
| Quotation not created | "This Enquiry hasn't a Quotation. Please confirm before moving status to Order Confirmed." | Yes |
| Quotation not approved | "This Enquiry's Quotation is not approved. Please confirm before moving status to Order Confirmed." | Yes |

---