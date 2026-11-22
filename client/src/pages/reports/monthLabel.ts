import dayjs from 'dayjs';

/**
 * Display label for a report's `YYYY-MM` month. Anchored to the first of the month before
 * formatting — a bare "2026-08" is not a date dayjs is obliged to parse. `null` is a bucket for
 * records with no date yet (an order confirmed before its event date was known).
 */
export function monthLabel(month: string | null): string {
  if (month === null) return 'No event date';
  const parsed = dayjs(`${month}-01`);
  return parsed.isValid() ? parsed.format('MMM YYYY') : month;
}
