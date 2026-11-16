import dayjs, { type Dayjs } from 'dayjs';
import type { ExpenseGranularity } from '../../types/report';
import { dateRangeParams } from '../../utils/dateRange';
import { startOfWeekMonday } from '../calendar/weekUtils';

// The Duration dropdown shared by the Dashboard's report tabs (Orders, Expenses): one choice turns
// into a date window and the bucket size its charts read best at.

export type Duration = 'LAST_WEEK' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM_MONTH';

export const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: 'LAST_WEEK', label: 'Last Week' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'LAST_MONTH', label: 'Last Month' },
  { value: 'THIS_YEAR', label: 'Year' },
  { value: 'CUSTOM_MONTH', label: 'Custom Month' },
];

export interface DurationRange {
  from: string;
  to: string;
  /** A week reads best day by day, a single month week by week, a whole year month by month. */
  granularity: ExpenseGranularity;
}

export function durationRange(duration: Duration, customMonth: Dayjs): DurationRange {
  switch (duration) {
    case 'THIS_YEAR': {
      const now = dayjs();
      return {
        from: now.startOf('year').format('YYYY-MM-DD'),
        to: now.endOf('year').format('YYYY-MM-DD'),
        granularity: 'month',
      };
    }
    case 'CUSTOM_MONTH':
      return {
        from: customMonth.startOf('month').format('YYYY-MM-DD'),
        to: customMonth.endOf('month').format('YYYY-MM-DD'),
        granularity: 'week',
      };
    default: {
      const { from, to } = dateRangeParams(duration);
      // The two month windows are weekly; the two week windows are daily.
      const monthly = duration === 'THIS_MONTH' || duration === 'LAST_MONTH';
      return { from, to: to ?? from, granularity: monthly ? 'week' : 'day' };
    }
  }
}

/** One point per day / week / month of the range, empty where nothing happened, so a quiet one still shows. */
export function fillPeriods<T extends { period: string }>(
  trend: T[],
  range: DurationRange,
  empty: (period: string) => T,
): T[] {
  const known = new Map(trend.map((point) => [point.period, point]));
  const filled: T[] = [];
  const end = dayjs(range.to);
  // A week is keyed by its Monday, which for the first week may fall before the range starts.
  const start = range.granularity === 'week' ? startOfWeekMonday(dayjs(range.from)) : dayjs(range.from);
  const unit = range.granularity === 'month' ? 'month' : 'day';
  const step = range.granularity === 'week' ? 7 : 1;
  const format = range.granularity === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';

  for (let cursor = start; !cursor.isAfter(end, unit); cursor = cursor.add(step, unit)) {
    const period = cursor.format(format);
    filled.push(known.get(period) ?? empty(period));
  }
  return filled;
}

export function periodLabel(
  period: string,
  granularity: ExpenseGranularity,
  long: boolean,
  range: DurationRange | null,
): string {
  // Month buckets arrive as `YYYY-MM`; anchored to the first of the month before parsing.
  const parsed = dayjs(granularity === 'month' ? `${period}-01` : period);
  if (!parsed.isValid()) return period;
  if (granularity === 'day') return parsed.format(long ? 'ddd, D MMM YYYY' : 'D MMM');
  if (granularity === 'month') return parsed.format(long ? 'MMMM YYYY' : 'MMM YY');

  // A week runs Monday to Sunday, clipped to the chosen range so the first and last weeks of a
  // month show only the days that are actually in it.
  const rangeStart = range ? dayjs(range.from) : parsed;
  const rangeEnd = range ? dayjs(range.to) : parsed.add(6, 'day');
  const weekStart = parsed.isBefore(rangeStart) ? rangeStart : parsed;
  const weekEnd = parsed.add(6, 'day').isAfter(rangeEnd) ? rangeEnd : parsed.add(6, 'day');
  const sameMonth = weekStart.month() === weekEnd.month();
  const text = sameMonth
    ? `${weekStart.format('D')}–${weekEnd.format('D MMM')}`
    : `${weekStart.format('D MMM')} – ${weekEnd.format('D MMM')}`;
  return long ? `${text} ${weekEnd.format('YYYY')}` : text;
}
