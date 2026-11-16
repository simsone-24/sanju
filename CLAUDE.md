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

Use integer auto-increment primary keys (`Int @id @default(autoincrement())`, NOT NULL).

Foreign keys are integers too. Keep a foreign key nullable only where the relationship is genuinely optional.

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

---

# Change Summary Rule

After completing any task that changes code, create or update a summary file.

Location: `md files/changes/YYYY-MM-DD.md` (one file per day; append new entries to the same day's file).

Each entry must contain

- Title of the change
- Files created / modified / deleted
- What changed and why
- Database changes (link to the SQL file, or "None")
- API changes (endpoint, method, request / response), or "None"
- Follow-up notes or known limitations

Keep entries short and factual. Never skip the summary.

---

# Database Change Tracking

Every time a table, column, index, foreign key, enum or constraint is created, altered or dropped, write a SQL file for it in addition to the Prisma schema and migration.

Location: `database/YYYY-MM-DD/NN_short_description.sql`

- `YYYY-MM-DD` is the date the change was made.
- `NN` is a two-digit order number within that date (`01`, `02`, ...), so files run in the correct order.
- `short_description` is snake_case, e.g. `01_add_quotation_advance_amount.sql`.

Each file must contain

- A header comment: date, purpose, related module / feature
- The exact SQL (`CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, ...) matching MySQL and the Prisma migration
- A commented rollback section (`-- ROLLBACK:`) with the reverse SQL

Rules

- One file per logical change; never edit a SQL file after it has been committed, add a new one instead.
- Keep `server/prisma/schema.prisma` and the Prisma migration in sync with the SQL file.
- Reference the SQL file in the day's change summary.
- If a task has no database change, do not create a SQL file.
