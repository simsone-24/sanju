import dayjs, { type Dayjs } from 'dayjs';

// One vocabulary of named date windows for every index page's Date Range dropdown, so "This Week"
// resolves identically in Enquiries, Orders, Quotations and Rent rather than each module carrying
// its own near-duplicate switch. A page picks the subset that suits the column it filters on:
// event dates look forward, dates of transactions that already happened look back.
export type DateRangePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'TOMORROW'
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'NEXT_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'NEXT_MONTH'
  | 'UPCOMING';

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  TOMORROW: 'Tomorrow',
  THIS_WEEK: 'This Week',
  LAST_WEEK: 'Last Week',
  NEXT_WEEK: 'Next Week',
  THIS_MONTH: 'This Month',
  LAST_MONTH: 'Last Month',
  NEXT_MONTH: 'Next Month',
  UPCOMING: 'Upcoming',
};

/** Forward-looking windows, for modules keyed on an event date that is yet to happen. */
export const EVENT_DATE_PRESETS: readonly DateRangePreset[] = [
  'TODAY',
  'TOMORROW',
  'THIS_WEEK',
  'NEXT_WEEK',
  'THIS_MONTH',
  'NEXT_MONTH',
];

/** Backward-looking windows, for modules keyed on the date a transaction was recorded. */
export const TRANSACTION_DATE_PRESETS: readonly DateRangePreset[] = [
  'TODAY',
  'YESTERDAY',
  'THIS_WEEK',
  'LAST_WEEK',
  'THIS_MONTH',
  'LAST_MONTH',
];

/** `to: null` means open-ended — Upcoming is everything from today onwards. */
export function dateRangeBounds(preset: DateRangePreset): { from: Dayjs; to: Dayjs | null } {
  const today = dayjs();
  switch (preset) {
    case 'TODAY':
      return { from: today, to: today };
    case 'YESTERDAY': {
      const yesterday = today.subtract(1, 'day');
      return { from: yesterday, to: yesterday };
    }
    case 'TOMORROW': {
      const tomorrow = today.add(1, 'day');
      return { from: tomorrow, to: tomorrow };
    }
    case 'THIS_WEEK':
      return { from: today.startOf('week'), to: today.endOf('week') };
    case 'LAST_WEEK':
      return { from: today.subtract(1, 'week').startOf('week'), to: today.subtract(1, 'week').endOf('week') };
    case 'NEXT_WEEK':
      return { from: today.add(1, 'week').startOf('week'), to: today.add(1, 'week').endOf('week') };
    case 'THIS_MONTH':
      return { from: today.startOf('month'), to: today.endOf('month') };
    case 'LAST_MONTH':
      return { from: today.subtract(1, 'month').startOf('month'), to: today.subtract(1, 'month').endOf('month') };
    case 'NEXT_MONTH':
      return { from: today.add(1, 'month').startOf('month'), to: today.add(1, 'month').endOf('month') };
    case 'UPCOMING':
      return { from: today, to: null };
  }
}

/** Same bounds as `dateRangeBounds`, pre-formatted for the API's `YYYY-MM-DD` date params. */
export function dateRangeParams(preset: DateRangePreset): { from: string; to?: string } {
  const { from, to } = dateRangeBounds(preset);
  return { from: from.format('YYYY-MM-DD'), to: to ? to.format('YYYY-MM-DD') : undefined };
}

/**
 * Narrows an untrusted value (a URL query param, a persisted filter) to a preset the given page
 * actually offers, so a hand-edited link can never select a window the dropdown cannot display.
 */
export function toDateRangePreset(
  value: string | null | undefined,
  allowed: readonly DateRangePreset[],
): DateRangePreset | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as DateRangePreset) : null;
}
