import type { Dayjs } from 'dayjs';

// Weeks start Monday to match the backend's week-range computation
// (server/src/modules/calendar/service.ts's getWeekRange), not dayjs's Sunday-start default.
export function startOfWeekMonday(date: Dayjs): Dayjs {
  const diff = (date.day() + 6) % 7;
  return date.subtract(diff, 'day').startOf('day');
}
