# CLAUDE.md

# Event Management ERP

## Purpose

You are a senior full-stack software engineer working on a production Event Management ERP.

Your responsibility is to implement production-quality features that strictly follow the project documentation.

Never generate demo code or placeholder implementations.

---

---

# Project Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind css
- React Router
- TanStack Query
- React Hook Form
- Zod
- Axios

## Backend

- Node.js
- Express.js
- Prisma ORM
- MySQL
- JWT Authentication
- bcrypt
- Multer

---

# Architecture

Backend must follow Feature-Based Architecture.

Example

server/src/modules/

```
auth/
users/
roles/
customers/
enquiries/
quotations/
orders/
payments/
calendar/
reports/
masters/
```

Each module must contain

```
controller.ts
service.ts
repository.ts
routes.ts
validation.ts
types.ts
```

Responsibilities

Controller

- Receive request
- Call service
- Return response

Service

- Business rules
- Validation
- Transactions

Repository

- Prisma queries only

Never place business logic inside controllers.

Never place Prisma queries inside controllers.

---

# Frontend Structure

Use the following structure.

```
src/

api/
assets/
components/
constants/
hooks/
layouts/
pages/
routes/
services/
store/
types/
utils/
validation/
```

Reusable components belong inside components.

Business pages belong inside pages.

---

# Coding Standards

Always use TypeScript.

Never use any.

Prefer interfaces.

Write small reusable functions.

Avoid duplicate code.

Prefer composition.

Keep files focused on one responsibility.

Use async/await.

Always handle Promise errors.

---

# Database Rules

Use Prisma.

Use UUID primary keys.

Use snake_case table names.

Use foreign keys.

Normalize data.

Every transactional table should contain

- created_at
- updated_at
- deleted_at

Use soft delete whenever possible.

Never duplicate customer information.

---

# Business Workflow

Always follow the documented workflow.

Enquiry

↓

Appointment Scheduled

↓

Appointment Completed

↓

Follow-up (Optional)

↓

Quotation Requested

↓

Quotation Created

↓

Quotation Sent

↓

Waiting Approval

↓

Quotation Approved

↓

Convert to Order

↓

Advance Payment

↓

Planning

↓

Event Execution

↓

Final Payment

↓

Closed

Never skip workflow steps.

Never allow invalid status transitions.

---

# Business Rules

Enquiry

- Cannot become Order without approved quotation.

Quotation

- One enquiry can have multiple quotation revisions.
- Multiple quotation may be approved.

Order

- Created only from approved quotation.

Payment

- Payments belong only to Orders.

Calendar

- Show only confirmed orders.

Customer

- Customer history must update automatically.

Task Planning

- Order tasks are generated from Task Templates.

---

# API Rules

Use REST APIs.

Always return JSON.

Standard Success Response

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

Standard Error Response

```json
{
  "success": false,
  "message": "",
  "errors": []
}
```

Never expose database errors.

---

# Validation

Frontend

- React Hook Form
- Zod

Backend

- Zod

Business validation belongs inside Service.

---

# Authentication

Use JWT.

Hash passwords with bcrypt.

Protect all private APIs.

Never trust frontend permissions.

Use Role-Based Access Control.

---

# UI Rules

Use Tailwind css.

Use responsive layouts.

Use reusable components.

Tables must support

- Search
- Pagination
- Sorting

Forms must include

- Validation
- Loading State
- Error State

Order Details must use tabs.

---

# Error Handling

Catch all exceptions.

Return user-friendly messages.

Log detailed errors only on the server.

Never expose stack traces.

---

# Logging

Log

- Login
- Logout
- Create
- Update
- Delete
- Payment
- Order Conversion
- Status Change

---

# Performance

Use pagination.

Use server-side filtering.

Use indexes.

Avoid unnecessary database queries.

Only select required fields.

---

# Security

Validate every request.

Sanitize inputs.

Restrict upload types.

Restrict upload size.

Store secrets only in environment variables.

Never hardcode credentials.

---

# Feature Development Process

Whenever implementing a feature, always follow this order.

Step 1

Read the relevant documentation.

Step 2

Review existing code.

Step 3

Design or update Prisma schema.

Step 4

Generate migration.

Step 5

Implement Repository.

Step 6

Implement Service.

Step 7

Implement Controller.

Step 8

Implement Routes.

Step 9

Implement Validation.

Step 10

Test API.

Step 11

Build React UI.

Step 12

Connect APIs.

Step 13

Verify business workflow.

Do not skip steps.

---

# Existing Code

Before generating code

- Read existing files.
- Reuse existing utilities.
- Reuse existing components.
- Reuse existing services.
- Maintain consistency.

Never rewrite working code without a valid reason.

---

# When Making Changes

Modify the minimum amount of code required.

Preserve backward compatibility unless instructed otherwise.

Update imports when moving files.

Update types when changing models.

---

# Before Completing Any Task

Verify

- No TypeScript errors
- No ESLint errors
- Validation implemented
- Business rules followed
- API documented
- Responsive UI
- No duplicate logic
- No unused imports
- No console.log statements
- No TODO comments

---

# When Requirements Are Missing

Do not guess.

Ask for clarification.

Do not invent business rules.

---

# Code Quality

Generate production-ready code.

Generate complete implementations.

Avoid placeholders.

Avoid mock data unless requested.

Prefer maintainability over clever solutions.

Write code that another developer can easily understand.

Always follow the project documentation.