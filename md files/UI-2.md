# Form Navigation Guidelines

## Current Behavior

Currently, every module opens the Create/Edit form inside the listing page (inline form).

Example

Bookings List

----------------------------------------------------
| Search | Filter | + New Booking                  |
----------------------------------------------------
| Table                                      |
|--------------------------------------------|
|                                            |
| Create Form Opens Here ❌                  |
|                                            |
----------------------------------------------------

This makes the page crowded and reduces usability.

---

## Expected Behavior

Every Create/Edit action should navigate to a dedicated page.

Example

Bookings

/bookings

↓

Click "New Booking"

↓

Navigate to

/bookings/create

↓

Click Edit

↓

Navigate to

/bookings/{id}/edit

This provides:

- Better user experience
- More working space
- Easier validation
- Cleaner UI
- Mobile-friendly layout
- Consistent navigation

---

# Breadcrumb

Every form page should include breadcrumbs.

Dashboard
>
Bookings
>
New Booking

or

Dashboard
>
Bookings
>
Edit Booking

---

# Form Header

Each page should have a clear header.

Example

------------------------------------
New Booking

Create a new customer booking.

[Cancel]     [Save Booking]
------------------------------------

For Edit

------------------------------------
Edit Booking

Update booking information.

[Cancel]     [Update Booking]
------------------------------------

---

# Form Layout

Use a maximum content width of 1000–1200px and center the form.

Example

-----------------------------------------------
               Customer Details
-----------------------------------------------

Customer Name      Phone Number

Email              WhatsApp

Address

-----------------------------------------------
               Event Details
-----------------------------------------------

Event Type         Event Date

Event Time         Venue

...

-----------------------------------------------
            Payment Details
-----------------------------------------------

Total Amount       Advance

Balance            Payment Method

-----------------------------------------------

[Cancel]           [Save]

---

# Form Sections

Group fields into cards.

Example

Customer Information

Event Information

Venue Information

Payment Details

Additional Notes

Attachments

This improves readability.

---

# Date Picker

## Current Behavior

The calendar opens only when clicking the calendar icon.

❌ Not user-friendly.

---

## Expected Behavior

The date picker should open when:

- Clicking anywhere inside the input
- Clicking the calendar icon
- Focusing the input with the keyboard

Example

✅ Click input → Calendar opens

✅ Click icon → Calendar opens

---

# Time Picker

## Current Behavior

The time picker opens only when clicking the icon.

---

## Expected Behavior

The time picker should open when:

- Clicking the input field
- Clicking the clock icon
- Focusing the field with the keyboard

---

# Date & Time Input Features

- Read-only text input (prevent invalid typing if desired)
- Full input area is clickable
- Keyboard accessible
- Clear selected value option
- Display selected date/time in a readable format
- Support locale formatting

Example

20 Jul 2026

09:30 AM

---

# Navigation

If the user has unsaved changes:

Display a confirmation dialog.

-------------------------------------

Unsaved Changes

You have unsaved changes.

Are you sure you want to leave?

[Stay]

[Leave]

-------------------------------------

---

# Save Actions

Buttons

- Save
- Save & New (optional)
- Save & Close
- Cancel

---

# Validation

Show validation messages below the relevant field.

Example

Phone Number

+91 __________

⚠ Phone number is required.

---

# Success Flow

After saving:

- Show a success toast.
- Redirect back to the module list.
- Highlight the newly created or updated record.

---

# Form UX Standards

- Dedicated page for Create/Edit
- Responsive two-column layout (single column on mobile)
- Sticky action bar (optional)
- Large clickable inputs
- Date picker opens from entire input
- Time picker opens from entire input
- Breadcrumb navigation
- Section-based forms
- Consistent spacing
- Keyboard accessible
- Auto-focus on first field
- Smooth page transitions