# Masters Module

## Version
1.1

---

# Overview

The existing **Roles Master** should be replaced with a flexible **User Groups** module.

The **Task Templates** master should be removed from the Masters module since Task Templates will be managed inside the **Order Module**.

The Masters module will contain only:

```
Masters
├── User Groups
└── Users
```

---

# Objectives

- Remove hardcoded roles.
- Allow administrators to create unlimited User Groups.
- Configure module-level permissions.
- Configure action-level permissions.
- Allow user-specific permission overrides.
- Easily support future modules without code changes.

---

# Permission Flow

```
User
        │
        ▼
Assigned User Group
        │
        ▼
Default Group Permissions
        │
        ▼
User Permission Override (Optional)
        │
        ▼
Final User Permissions
```

---

# 1. User Groups Module

## Purpose

A User Group defines the default permissions for multiple users.

Instead of creating predefined roles in code, administrators can create any number of custom groups based on business needs.

### Examples

- Administrator
- Manager
- Accountant
- Worker
- Sales Executive
- Event Coordinator
- Receptionist
- Marketing
- Custom Groups

There is no restriction on the number of User Groups.

---

# User Groups List

## Columns

| Field | Description |
|---------|------------|
| Group Name | Name of the User Group |
| Description | Description of the group |
| Total Users | Number of users assigned |
| Status | Active / Inactive |
| Actions | View, Edit |

---

# Create User Group

## Basic Information

| Field | Required |
|---------|----------|
| Group Name | ✅ Yes |
| Description | No |
| Status | ✅ Yes |

---

# Module Permissions

Each User Group contains permissions for every module.

Example modules:

- Dashboard
- Enquiries
- Quotations
- Orders
- Payment Tracker
- Calendar
- Customers
- Reports
- Masters

---

## Module Permission Matrix

| Module | View | Create | Edit | Delete | Export |
|---------|------|--------|------|--------|--------|
| Dashboard | ✓ | - | - | - | - |
| Enquiries | ✓ | ✓ | ✓ | ✗ | ✓ |
| Quotations | ✓ | ✓ | ✓ | ✗ | ✓ |
| Orders | ✓ | ✓ | ✓ | ✗ | ✓ |
| Payment Tracker | ✓ | ✓ | ✓ | ✗ | ✓ |
| Calendar | ✓ | - | - | - | - |
| Customers | ✓ | ✓ | ✓ | ✗ | ✓ |
| Reports | ✓ | - | - | - | ✓ |
| Masters | ✗ | ✗ | ✗ | ✗ | ✗ |

---

# Action-Level Permissions

Each module can expose additional actions.

### Enquiries

```
☑ View
☑ Create
☑ Edit
☐ Delete
☑ Assign
☑ Change Status
☑ Export
☑ Print
☐ Convert to Order
```

---

### Orders

```
☑ View
☑ Create
☑ Edit
☑ Cancel Order
☑ Complete Event
☑ Print
☑ Export
```

---

### Payment Tracker

```
☑ View
☑ Create Payment
☑ Edit Payment
☑ Delete Payment
☑ Export
☑ Print Receipt
```

Every module can define its own permissions based on business requirements.

---

# Sample User Groups

## Accountant

```
Dashboard

    View

Enquiries

    No Access

Quotations

    View

Orders

    View

Payment Tracker

    View
    Create Payment
    Edit Payment
    Export

Reports

    Payment Reports Only

Masters

    No Access
```

---

## Manager

```
Dashboard

    View

Enquiries

    Full Access

Quotations

    Full Access

Orders

    Full Access

Payment Tracker

    Full Access

Calendar

    View

Reports

    Full Access
```

---

## Worker

```
Dashboard

    View

Enquiries

    No Access

Orders

    View Only

Task Management

    View
    Update Checklist

Payment Tracker

    No Access

Reports

    No Access
```

---

# User Group Rules

- Group Name must be unique.
- A User Group cannot be deleted if users are assigned.
- Inactive groups cannot be assigned to new users.
- Changes to User Group permissions automatically apply to all assigned users unless overridden at the user level.

---

# 2. Users Module

## Purpose

The Users module manages all system users.

Each user belongs to one User Group and automatically inherits the permissions assigned to that group.

If required, additional permissions can be granted specifically to that user.

---

# Users List

## Columns

| Field | Description |
|---------|------------|
| Full Name | Employee Name |
| Username | Login Username |
| User Group | Assigned Group |
| Mobile Number | Contact Number |
| Email | Email Address |
| City | City |
| Status | Active / Inactive |
| Actions | View, Edit |

---

# Create User

## Basic Information

| Field | Required | Description |
|---------|----------|-------------|
| Employee Code | No | Optional employee identifier |
| Full Name | ✅ Yes | Employee/User name |
| Username | ✅ Yes | Login username |
| Password | ✅ Yes | Login password |
| Confirm Password | ✅ Yes | Password confirmation |
| Mobile Number | ✅ Yes | Primary contact number |
| Email Address | No | Optional email |
| City | No | User city |
| User Group | ✅ Yes | Assign a User Group |
| Profile Photo | No | User image |
| Status | ✅ Yes | Active / Inactive |

---

# Login Credentials

Users log into the application using:

- Username
- Password

---

# Contact Information

The following information is stored for each user:

- Full Name
- Mobile Number
- Email Address (Optional)
- City

These details can be displayed throughout the application, such as:

- Created By
- Assigned To
- Activity Logs
- Order History
- Audit Logs

---

# Permission Inheritance

Example

```
User

Simsone

↓

User Group

Accountant

↓

Inherited Permissions

Payment Tracker

View
Create Payment
Edit Payment
```

Normally, no further configuration is required.

---

# User Permission Override

Sometimes a single user requires additional permissions without changing the permissions of the entire User Group.

Example:

```
User Group

Accountant

↓

Enquiries

No Access
```

Business Requirement:

> Only **Simsone** should be able to view Enquiries.

Instead of modifying the Accountant group, grant an individual permission.

---

# User Override Screen

```
Additional Permissions

Enquiries

☑ View
☐ Create
☐ Edit
☐ Delete

Orders

☑ View

Reports

☑ Payment Reports
```

---

# Final Permission Result

```
Accountant Group

Payment Tracker Only

+

Simsone Override

View Enquiries

=

Final Permissions

Payment Tracker
Enquiries (View Only)
```

Only Simsone receives the additional permission.

All other Accountant users remain unchanged.

---

# Permission Resolution Logic

```
User Login

        │
        ▼

Load Assigned User

        │
        ▼

Load User Group

        │
        ▼

Load Group Permissions

        │
        ▼

Load User Overrides

        │
        ▼

Merge Permissions

        │
        ▼

Generate Final Permission Set

        │
        ▼

Open Dashboard
```

## Priority

```
1. User Permission Override

↓

2. User Group Permission

↓

3. No Permission
```

---

# Validation Rules

## User Groups

- Group Name must be unique.
- Cannot delete a User Group with assigned users.
- Inactive User Groups cannot be assigned to new users.

---

## Users

- Full Name is mandatory.
- Username must be unique.
- Password is mandatory when creating a new user.
- Mobile Number is mandatory.
- Email Address is optional.
- City is optional.
- User Group is mandatory.
- Status is mandatory.
- Inactive users cannot log in.

---

# Future Enhancements

- Clone User Group
- Copy Permissions from Existing Group
- Department-wise Groups
- Branch-wise Permissions
- Permission Templates
- Audit Log for Permission Changes
- Login History
- Two-Factor Authentication (2FA)
- Password Expiry Policy
- IP-based Login Restrictions

---

# Benefits

- Unlimited custom User Groups.
- No hardcoded roles.
- Flexible permission management.
- Module-level and action-level security.
- User-specific permission overrides.
- Easy to maintain and extend.
- Supports future modules without database redesign.
- Suitable for both small businesses and enterprise-scale organizations.