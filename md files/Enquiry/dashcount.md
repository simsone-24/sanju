# Dashboard Count Logic

## Filter Interaction

Each card's count narrows along with every other active list filter — search, Enquiry Status,
Appointment Status, Event Type, Assigned User, and the Appointment/Event date ranges. Only the
status condition that defines the card itself (e.g. `enquiry_status <> 'Order Lost'` for Total
Enquiries) stays fixed, so selecting a card never zeroes out the other three.

The `view` filter that a card's own click applies is excluded from this narrowing — a card does
not fold its own selection back into its own count.

## 1. Total Enquiries

### Title

```
Total Enquiries
```

### Count Logic

Display the total number of active enquiries, excluding enquiries marked as **Order Lost**.

This represents the total active enquiry pipeline.

### SQL Logic

```sql
SELECT COUNT(*)
FROM enquiries
WHERE enquiry_status <> 'Order Lost';
```

### Click Action

Apply filter

```text
Enquiry Status != Order Lost
```

Display all active enquiries except Order Lost.

---

## 2. Confirmed Enquiries

### Count Logic

```sql
SELECT COUNT(*)
FROM enquiries
WHERE enquiry_status = 'Order Confirmed';
```

### Click Action

```text
Enquiry Status = Order Confirmed
```

---

## 3. Pending Enquiries

### Count Logic

Display enquiries that are still in progress and have **not** been confirmed or lost.

```sql
SELECT COUNT(*)
FROM enquiries
WHERE enquiry_status NOT IN (
    'Order Confirmed',
    'Order Lost'
);
```

### Click Action

```text
Enquiry Status NOT IN (
    Order Confirmed,
    Order Lost
)
```

---

## 4. Appointment Pending

### Count Logic

Display enquiries with appointments that are not yet completed.

Include:

- Pending
- In Progress

```sql
SELECT COUNT(*)
FROM enquiries
WHERE enquiry_status <> 'Order Lost'
AND appointment_status IN (
    'Pending',
    'In Progress'
);
```

### Click Action

```text
Enquiry Status != Order Lost
AND
Appointment Status IN (
    Pending,
    In Progress
)
```