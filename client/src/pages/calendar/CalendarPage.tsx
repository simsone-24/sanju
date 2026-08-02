import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Button, CircularProgress, IconButton, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import * as calendarService from '../../services/calendarService';
import type { CalendarEvent } from '../../types/calendar';
import { CALENDAR_COLORS } from './calendarColors';
import DayList from './DayList';
import MonthGrid from './MonthGrid';
import WeekGrid from './WeekGrid';
import { startOfWeekMonday } from './weekUtils';

type ViewMode = 'month' | 'week' | 'day';

const VIEW_MODES = new Set<string>(['month', 'week', 'day']);

function parseView(value: string | null): ViewMode {
  return value && VIEW_MODES.has(value) ? (value as ViewMode) : 'month';
}

function parseDate(value: string | null): Dayjs {
  if (!value) return dayjs();
  const parsed = dayjs(value, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : dayjs();
}

function periodLabel(view: ViewMode, referenceDate: Dayjs): string {
  if (view === 'month') return referenceDate.format('MMMM YYYY');
  if (view === 'day') return referenceDate.format('D MMMM YYYY');
  const start = startOfWeekMonday(referenceDate);
  const end = start.add(6, 'day');
  return start.isSame(end, 'month') ? `${start.format('D')} – ${end.format('D MMM YYYY')}` : `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`;
}

// docs/03_MODULES.md §5 / docs/06_UI_UX_GUIDELINES.md §16: Month/Week/Day views, a 5-color
// legend, and "Click Event -> Open Order Details." Calendar events are just Orders within a date
// range (server/src/modules/calendar) — there's no separate calendar entity, so nothing here is
// creatable/editable, only viewable.
export default function CalendarPage() {
  const navigate = useNavigate();
  const canView = usePermission('CALENDAR', 'canView');

  // View mode and the period being shown live in the query string, so the calendar can be linked
  // to directly — the Dashboard's event tiles open `?view=day&date=YYYY-MM-DD` — and a refresh or
  // a shared link reproduces the same period.
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseView(searchParams.get('view'));
  const referenceDate = parseDate(searchParams.get('date'));

  function patchParams(patch: { view?: ViewMode; date?: Dayjs }) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (patch.view) next.set('view', patch.view);
        if (patch.date) next.set('date', patch.date.format('YYYY-MM-DD'));
        return next;
      },
      { replace: true },
    );
  }

  const bucketKey =
    view === 'month' ? referenceDate.format('YYYY-MM') : startOfWeekMonday(referenceDate).format('YYYY-MM-DD');

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar', view, view === 'day' ? referenceDate.format('YYYY-MM-DD') : bucketKey],
    queryFn: (): Promise<CalendarEvent[]> => {
      if (view === 'month') return calendarService.getMonth(referenceDate.month() + 1, referenceDate.year());
      if (view === 'week') return calendarService.getWeek(referenceDate.format('YYYY-MM-DD'));
      return calendarService.getDay(referenceDate.format('YYYY-MM-DD'));
    },
    enabled: canView,
  });

  function shift(amount: number) {
    const unit = view === 'month' ? 'month' : view === 'week' ? 'week' : 'day';
    patchParams({ date: referenceDate.add(amount, unit) });
  }

  function handleEventClick(event: CalendarEvent) {
    navigate(`/orders/${event.id}`);
  }

  if (!canView) {
    return (
      <>
        <PageHeader title="Calendar" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Calendar' }]} />
        <Typography color="text.secondary">You do not have access to view the calendar.</Typography>
      </>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Calendar"
        subtitle="Click an event to open its order details."
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Calendar' }]}
      />

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => shift(-1)} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h2" sx={{ minWidth: 200, textAlign: 'center' }}>
            {periodLabel(view, referenceDate)}
          </Typography>
          <IconButton onClick={() => shift(1)} size="small">
            <ChevronRightIcon />
          </IconButton>
          <Button size="small" onClick={() => patchParams({ date: dayjs() })}>
            Today
          </Button>
        </Stack>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_event, next: ViewMode | null) => next && patchParams({ view: next })}
        >
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="day">Day</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {Object.values(CALENDAR_COLORS).map((entry) => (
          <Stack key={entry.label} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.hex }} />
            <Typography variant="caption" color="text.secondary">
              {entry.label}
            </Typography>
          </Stack>
        ))}
      </Stack>

      {isLoading ? (
        <CircularProgress size={28} />
      ) : (
        <>
          {view === 'month' && (
            <MonthGrid referenceDate={referenceDate} events={events ?? []} onEventClick={handleEventClick} />
          )}
          {view === 'week' && (
            <WeekGrid referenceDate={referenceDate} events={events ?? []} onEventClick={handleEventClick} />
          )}
          {view === 'day' && <DayList events={events ?? []} onEventClick={handleEventClick} />}
        </>
      )}
    </Box>
  );
}
