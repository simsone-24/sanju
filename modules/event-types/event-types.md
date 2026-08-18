# Event Types

## Purpose

The master list of event categories (wedding, reception, birthday, …) that an enquiry is raised
against. Each type carries a colour used by the calendar and the list badges, plus a display order
for the dropdown.

## Source Files

```
server/src/modules/event-types/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

| Table | Columns |
| --- | --- |
| `event_types` | `event_name`, `color_code`, `display_order`, `status` (`ACTIVE` / `INACTIVE`), `company_id`, timestamps, `deleted_at`. |

## API

Base path `/api/v1/event-types`. All routes require authentication.

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/` | authenticated only | Paginated list with search and status filter. |
| `GET` | `/:id` | `MASTERS.canView` | One event type. |
| `POST` | `/` | `MASTERS.canCreate` | `{ eventName, colorCode?, displayOrder? }` |
| `PUT` | `/:id` | `MASTERS.canEdit` | Partial update, plus `status`. |
| `DELETE` | `/:id` | `MASTERS.canDelete` | Soft delete. |

## Business Rules

- Reading the list needs **no Masters access**: it is the source of the Event Type dropdown on the
  enquiry form, and the sales roles that raise enquiries hold no Masters rights. Everything that
  changes the master data still requires Masters.
- Event type names are unique — a duplicate returns
  `409 An event type with this name already exists.`
- Deactivating (`status = INACTIVE`) rather than deleting is the way to retire a type without
  disturbing the enquiries already raised against it.

## Frontend

- `client/src/pages/masters/tabs/EventTypesTab.tsx`
- `client/src/services/eventTypeService.ts`
- Consumed by the enquiry form, the enquiry filters and the calendar colour coding.

## Related Modules

[Enquiries](../enquiries/enquiries.md) · [Calendar](../calendar/calendar.md)
