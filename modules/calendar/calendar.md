# Calendar

## Purpose

A read-only view of confirmed orders laid out by event date, in month, week and day forms. It owns
no data — it is a projection of `orders` joined to their enquiry and customer.

## Source Files

```
server/src/modules/calendar/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
```

## Data

No table. Reads `orders`, `enquiries`, `event_types` and `customers`.

### Event shape

```
id, orderNumber, customerName, eventName, eventType,
eventDate, eventTime, mahal, venue, status, color
```

`eventName` falls back to the event type's name when the enquiry has no specific event name.

### Colour mapping

| Order status | Colour |
| --- | --- |
| `YET_TO_START` | `BLUE` |
| `IN_PROGRESS` | `ORANGE` |
| `ORDER_CLOSED` | `GREEN` |
| `REJECTED` | `GREY` |

## API

Base path `/api/v1/calendar`. All routes require authentication and `CALENDAR.canView`.

| Method | Path | Query | Description |
| --- | --- | --- | --- |
| `GET` | `/month` | `month` (1–12), `year` (2000–2100) | Events in the calendar month. |
| `GET` | `/week` | `date` | Events in the Monday–Sunday week containing the date. |
| `GET` | `/day` | `date` | Events on that day. |

## Business Rules

- **An order with no event date never appears.** Confirming an enquiry that has no event date yet
  still raises the order; it simply stays off the calendar until a date is entered on it. The range
  filter already excludes undated rows.
- Ranges are computed in **UTC**. A week runs Monday to Sunday: the offset is derived from the given
  date's UTC weekday, and Sunday is treated as the last day of the preceding week, not the first of
  the next.
- Day and month ranges end at `23:59:59.999` so the final day is inclusive.
- `eventTime` (`MORNING` / `EVENING`) comes from the enquiry — it is the coarse time of day of the
  event, distinct from the appointment time, which is when the customer was met.

## Frontend

- `client/src/pages/calendar/CalendarPage.tsx`
- `MonthGrid.tsx`, `WeekGrid.tsx`, `DayList.tsx`, `EventListPanel.tsx`, `EventDetailCard.tsx`
- `client/src/services/calendarService.ts`

## Related Modules

[Orders](../orders/orders.md) · [Enquiries](../enquiries/enquiries.md) ·
[Event Types](../event-types/event-types.md)
