# Enquiry Module Flow Enhancement

> **Note:**  
> All enquiry fields are already available in the existing system. This document only describes the **workflow** and **additional features**. No changes are required to the existing enquiry fields.

---

# Enquiry Module Workflow

## Step 1 - Create Enquiry

The user opens the **Enquiry Module** and clicks **New Enquiry**.

The system should support two enquiry types:

### Option 1: New Customer

If the customer is visiting for the first time:

- User selects **New Customer**
- Enter customer basic details using the existing enquiry form
- Enter enquiry details
- Select the enquiry status
- Save the enquiry

After saving:

- Customer is automatically added to the Customer Master.
- Enquiry is created successfully.

---

### Option 2: Existing Customer

If the customer already exists:

- User selects **Existing Customer**
- Search customer by Name / Mobile Number / Customer Code
- Select the customer

The system should automatically populate the existing customer details into the enquiry form.

The user then:

- Updates or verifies enquiry details
- Selects the enquiry status
- Saves the enquiry

No duplicate customer record should be created.

---

# Enquiry Status

During enquiry creation, the user should select the enquiry status from the available status list.

The status will indicate the current stage of the enquiry and can be updated later as the enquiry progresses.

---

# Enquiry List (Index Page)

After saving, the enquiry should appear in the Enquiry List.

Each enquiry should provide the following actions:

- View
- Edit
- Create Quotation

> **Note:** "Create Quotation" should only be displayed if a quotation has not yet been created (or according to the business rules).

---

# Quotation Section

Sometimes the customer requests a quotation immediately after the enquiry is created.

To support this workflow, a **Quotation** section should be available from the enquiry.

## Create Quotation

From the Enquiry List or Enquiry Detail page, the user clicks **Create Quotation**.

The system should automatically load:

- Customer Details
- Event Details
- Venue
- Event Date
- Other relevant information already available in the enquiry

The user only needs to complete the quotation details and save it.

After saving:

- The quotation is linked to the enquiry.
- The quotation can be viewed or edited later.
- The enquiry remains associated with its quotation(s).

---

# Updated Workflow

```text
Enquiry List
      │
      ▼
New Enquiry
      │
      ├───────────────┐
      │               │
      ▼               ▼
New Customer     Existing Customer
      │               │
Enter Details   Search Customer
      │               │
      │         Auto Fill Details
      └───────┬───────┘
              │
      Select Enquiry Status
              │
              ▼
         Save Enquiry
              │
              ▼
        Enquiry List
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
   View      Edit   Create Quotation
                         │
                         ▼
                 Create & Save Quotation
                         │
                         ▼
              Quotation Linked to Enquiry
```

---

# Functional Notes

- Existing enquiry fields remain unchanged.
- Customer details should not be duplicated.
- Existing customers should be selected through a searchable lookup.
- Customer information should be automatically populated after selection.
- The quotation should always be linked to the corresponding enquiry.
- Users should be able to create a quotation directly from the enquiry without re-entering customer or event details.
- Future enhancements (such as quotation versioning, PDF generation, WhatsApp sharing, and order conversion) can be implemented without changing this workflow.