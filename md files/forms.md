# Form UI/UX Improvements Required

The current forms need significant improvements to provide a modern, clean, and user-friendly experience. The existing layout feels crowded and some form controls are not functioning correctly. Please redesign all forms across every module using the following requirements.

---

# Overall Form Design

- Create a modern and professional form layout.
- Use a dedicated page for Create and Edit instead of opening forms inside the listing page.
- Center the form with a maximum width of 1000–1200px.
- Organize fields into logical sections using cards.
- Maintain consistent spacing, alignment, and typography throughout all forms.

Example Sections

- Customer Information
- Event Information
- Venue Details
- Payment Information
- Additional Information
- Notes & Attachments

---

# Labels & Input Fields

Improve all form controls.

Requirements

- Clear and descriptive labels above each input.
- Proper spacing between labels and inputs.
- Consistent input height (48–52px).
- Rounded corners.
- Placeholder text where appropriate.
- Required fields should display a red "*" indicator.
- Show validation messages below the field.
- Display helper text when necessary.

---

# Date Picker

The current date picker is not working properly.

Current Issues

- The calendar opens only when clicking the icon.
- Users cannot easily select a date.
- The interaction is not user-friendly.

Required Improvements

- Clicking anywhere inside the input should open the calendar.
- Clicking the calendar icon should also open it.
- Keyboard users should be able to focus and open the calendar.
- Users must be able to navigate months and years easily.
- The selected date should display in a readable format.
- Support clearing the selected date if needed.

---

# Time Picker

The current time picker is difficult to use.

Required Improvements

- Clicking anywhere inside the input should open the time picker.
- Clicking the clock icon should also work.
- Allow users to easily select hours and minutes.
- Display the selected time in a readable format.
- Support both 12-hour and 24-hour formats if required.

---

# Dropdown Fields

Improve all select fields.

Requirements

- Searchable dropdowns where applicable.
- Keyboard navigation.
- Clear selected value.
- Placeholder text.
- Consistent styling with other inputs.

---

# Form Layout

Use a responsive two-column layout for desktop.

Example

Customer Name          Mobile Number

Event Type             Event Date

Event Time             Venue

Expected Guests        Budget

Notes

On mobile devices, automatically switch to a single-column layout.

---

# Buttons

Improve action buttons.

Include

- Save
- Save & Close
- Cancel

Buttons should include:

- Icons
- Loading state
- Disabled state while submitting

---

# Validation

Provide real-time validation.

Examples

- Required fields
- Invalid phone number
- Invalid email
- Date validation
- Time validation

Validation messages should appear below the corresponding field.

---

# Enquiry Module

The Enquiry form is currently incomplete.

Please review the Enquiry module requirements from the project documentation and implement **all required fields**.

Specifically, the **Enquiry Status** field is currently missing and must be added.

Ensure every field defined in the documentation is included and displayed in the correct section.

The Enquiry form should contain all required information for enquiry creation and follow-up.

---

# User Experience

The forms should provide a smooth and intuitive experience.

Requirements

- Auto-focus the first input.
- Preserve entered data until saved or cancelled.
- Warn users before leaving if there are unsaved changes.
- Display a success notification after saving.
- Redirect back to the listing page after a successful save/update.

---

# Expected Result

All forms across every module should be redesigned with a modern, clean, and professional appearance. Date and time pickers should function correctly, all labels and inputs should be properly aligned, validation should be clear, and every required field from the project documentation—including the missing **Enquiry Status** field—should be implemented. The overall experience should feel comparable to a premium SaaS CRM, making data entry faster, more intuitive, and enjoyable for end users.