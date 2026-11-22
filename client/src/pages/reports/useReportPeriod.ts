import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import type { DurationRange } from './reportDuration';

export type PeriodView = 'MONTHLY' | 'YEARLY';

export interface ReportPeriod {
  view: PeriodView;
  setView: (view: PeriodView) => void;
  /** The month shown in the Monthly view. */
  month: Dayjs;
  setMonth: (month: Dayjs) => void;
  /** The year shown in the Yearly view. */
  year: Dayjs;
  setYear: (year: Dayjs) => void;
  /** The window the chosen period covers; a month reads best day by day, a year month by month. */
  range: DurationRange;
  /** True while the period is the one a report opens on — the current month. */
  isDefault: boolean;
  reset: () => void;
}

/**
 * The period a Reports page tab shows: one calendar month (the current one by default) or a whole
 * year. Replaces free-form From/To dates so a report always answers "how was this month / year".
 */
export function useReportPeriod(): ReportPeriod {
  const [view, setView] = useState<PeriodView>('MONTHLY');
  const [month, setMonth] = useState(() => dayjs().startOf('month'));
  const [year, setYear] = useState(() => dayjs().startOf('year'));

  const range: DurationRange =
    view === 'MONTHLY'
      ? {
          from: month.startOf('month').format('YYYY-MM-DD'),
          to: month.endOf('month').format('YYYY-MM-DD'),
          granularity: 'day',
        }
      : {
          from: year.startOf('year').format('YYYY-MM-DD'),
          to: year.endOf('year').format('YYYY-MM-DD'),
          granularity: 'month',
        };

  const isDefault = view === 'MONTHLY' && month.isSame(dayjs(), 'month');

  function reset() {
    setView('MONTHLY');
    setMonth(dayjs().startOf('month'));
    setYear(dayjs().startOf('year'));
  }

  return { view, setView, month, setMonth, year, setYear, range, isDefault, reset };
}
