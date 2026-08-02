# Task Plan Module - Functional Specification

# Module Overview

The **Task Plan** module is used to manage and track all work that needs to be completed for an Order.

Instead of maintaining separate **Plan** and **Task** modules, this module combines both concepts into a single, easy-to-use workflow.

The module is designed to be flexible so users can create task groups based on the event requirements.

---

# Objectives

- Organize event work into logical task groups.
- Allow users to create unlimited task groups.
- Track progress of every task.
- Optionally upload completion photos.
- Display overall progress of each task group.
- Keep the UI simple and mobile-friendly.
- Prepare the module for future automation.

---

# Navigation

```
Orders
    └── View Order
            └── Task Plan
```

---

# Screen Layout

```
----------------------------------------------------------
Order Details
----------------------------------------------------------

+ Add Task Group

----------------------------------------------------------
▼ Chair Allocation                     3 / 5 Completed
----------------------------------------------------------

☑ Hall Chair Arrangement

☑ Stage Chair Arrangement

☐ VIP Chair Arrangement

☑ Bride Side Chairs

☐ Groom Side Chairs

----------------------------------------------------------
▼ Stage Decoration                    2 / 6 Completed
----------------------------------------------------------

☑ Stage Frame

☑ Flower Decoration

☐ LED Installation

☐ Sofa Placement

☐ Welcome Board

☐ Welcome Arch

----------------------------------------------------------
```

Task Groups should be displayed as expandable/collapsible cards.

---

# Task Group (Header)

A Task Group represents a category of work.

Examples:

- Chair Allocation
- Stage Decoration
- Dining Arrangement
- Lighting Setup
- Sound System
- Generator Setup
- Return Packing
- Cleaning

Each Task Group can contain multiple task items.

---

# Task Group Fields

| Field | Required | Description |
|--------|----------|-------------|
| Title | Yes | Name of the Task Group |
| Description | No | Optional description |
| Display Order | Auto | Used for sorting |

---

# Task Item (Line Item)

Each Task Group contains multiple task items.

Example

Task Group

```
Chair Allocation
```

Tasks

- Hall Chair Arrangement
- Stage Chair Arrangement
- VIP Chair Arrangement
- Bride Side Chairs
- Groom Side Chairs

---

# Task Item Fields

| Field | Required | Description |
|--------|----------|-------------|
| Task Name | Yes | Name of the work |
| Status | Yes | Pending / In Progress / Completed |
| Remarks | No | Additional notes |
| Completion Photo | No | Optional image upload |
| Completed At | Auto | Saved when marked completed |

---

# Task Status

Each task has three statuses.

```
Pending

In Progress

Completed
```

Rules

- Default status = Pending
- User can change Pending → In Progress
- User can change In Progress → Completed
- Completed tasks automatically save completion timestamp.

---

# Completion Photo

Photo upload is optional.

Users may upload a photo after completing a task.

Examples

- Stage Decoration
- Chair Arrangement
- Lighting Setup

Photo upload should never be mandatory.

---

# Progress Calculation

Each Task Group displays progress automatically.

Example

```
Chair Allocation

3 / 5 Completed

60%
```

Formula

```
Completed Tasks / Total Tasks × 100
```

---

# Add Task Group

When user clicks

```
+ Add Task Group
```

Display

```
Task Group Title

Description (Optional)

+ Add Task
```

---

# Task Group Status (Draft / Published)

A Task Group is written before it is handed to the team, so the create form saves it in one of two states.

```
Save as Draft   →  DRAFT
Save & Publish  →  PUBLISHED
```

| Status | Meaning |
|--------|---------|
| Draft | The plan is still being written. Shown on the Task Plan with a "Draft" badge and a dashed card, kept out of the order's progress totals, and its tasks cannot be ticked yet. |
| Published | Live work. Counted in the order's progress and executed by the team. |

Rules

- Default status = Published (a group saved with plain Save is live immediately).
- Draft → Published via the **Publish** button on the group's card.
- Published → Draft only while **every** task in the group is still Pending — a group whose work has started cannot be hidden from the totals again.
- Progress percentages, the Completed and Pending tiles, and the overall progress bar count published groups only.
- Existing groups created before this field are Published.

---

# Add Task

Inside each Task Group

```
+ Add Task
```

Allows user to create unlimited tasks.

Example

```
Task Name

Status

Remarks
```

---

# Edit Task

User can edit

- Task Name
- Status
- Remarks

If status becomes Completed

Automatically

- Save Completed Time

---

# Delete

Users can delete

- Task Group
- Task Item

Display confirmation dialog before deletion.

---

# UI Recommendations

Use Card Layout.

Example

```
+--------------------------------------------------+
| ▼ Chair Allocation                 3/5 Completed |
+--------------------------------------------------+

☑ Hall Chair Arrangement

☐ Stage Chair Arrangement

☑ VIP Chair Arrangement

---------------------------------------

+ Add Task

+--------------------------------------------------+
```

Benefits

- Easy to scan
- Minimal scrolling
- Mobile friendly
- Modern appearance

---

# Future Enhancements

These features are NOT required for Phase 1.

## Manager Notification

When all tasks inside a Task Group are completed,

Automatically send a notification to the assigned **Order Manager**.

Example

```
Task Group Completed

Order
ORD-1025

Task Group
Chair Allocation

Completed At
11:20 AM
```

Notification channels

- WhatsApp
- SMS
- Push Notification
- In-App Notification

---

## Additional Future Features

- Task Priority
- Due Date
- Assigned Employee
- Temporary Worker Name
- GPS Location
- Multiple Photos
- Activity Timeline
- Voice Notes
- Customer Signature
- QR Code Check-in
- Task Templates

---

# Database Design

## task_groups

| Field | Type |
|--------|------|
| id | bigint |
| order_id | bigint |
| title | varchar |
| description | text |
| status | enum(DRAFT, PUBLISHED) |
| display_order | integer |
| created_at | datetime |
| updated_at | datetime |

---

## task_items

| Field | Type |
|--------|------|
| id | bigint |
| task_group_id | bigint |
| task_name | varchar |
| status | enum(Pending, In Progress, Completed) |
| remarks | text |
| photo_path | varchar |
| completed_at | datetime |
| display_order | integer |
| created_at | datetime |
| updated_at | datetime |

---

# Business Rules

- One Order can have multiple Task Groups.
- One Task Group can have multiple Task Items.
- Task Groups should be displayed in display order.
- Tasks should be displayed in display order.
- Completion photo is optional.
- Completed timestamp is generated automatically.
- Progress is calculated dynamically.
- Users can create unlimited Task Groups and Tasks.
- Deleting a Task Group deletes all its Task Items.
- All future automation (notifications, team allocation, templates) should build on this structure.

---

# MVP Scope (Phase 1)

✅ Create Task Group

✅ Edit Task Group

✅ Delete Task Group

✅ Create Task Item

✅ Edit Task Item

✅ Delete Task Item

✅ Task Status

✅ Progress Calculation

✅ Optional Photo Upload

✅ Remarks

✅ Auto Completion Time

❌ Team Allocation

❌ Timeline

❌ GPS

❌ WhatsApp Notifications

❌ Task Templates

---

# Expected Outcome

The Task Plan module provides a simple, flexible, and scalable way to manage all execution activities for an order. Users can organize work into custom task groups, monitor completion progress, optionally attach proof photos, and prepare the system for future enhancements such as manager notifications, team allocation, and task templates without requiring major architectural changes.