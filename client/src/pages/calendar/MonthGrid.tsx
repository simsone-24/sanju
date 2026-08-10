import { Box, Popover, Stack, Typography } from '@mui/material';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import type { CalendarEvent } from '../../types/calendar';
import { CALENDAR_COLORS } from './calendarColors';
import EventDetailCard from './EventDetailCard';
import { startOfWeekMonday } from './weekUtils';

interface MonthGridProps {
  referenceDate: Dayjs;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

// Full names where the column is wide enough to carry them, the three-letter form below that.
const WEEKDAY_LABELS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
];
const MAX_VISIBLE_PER_DAY = 2;

// A solid colour pill per event, the same hue its card carries in the agenda rail. One line only:
// at a glance the grid answers "which days are busy, and how", and the click-through detail card
// carries the event name, venue and status that used to be crammed into a two-line bar.
function EventPill({ event, onClick }: { event: CalendarEvent; onClick: (target: HTMLElement) => void }) {
  const color = CALENDAR_COLORS[event.color];
  return (
    <Box
      onClick={(clickEvent) => onClick(clickEvent.currentTarget)}
      title={`${event.customerName} — ${event.eventName}`}
      sx={{
        cursor: 'pointer',
        borderRadius: 999,
        px: 1,
        py: 0.375,
        overflow: 'hidden',
        bgcolor: color.hex,
        boxShadow: '0 4px 10px -6px rgba(15, 23, 42, 0.8)',
        transition: 'transform 120ms ease, filter 120ms ease',
        '&:hover': { filter: 'brightness(1.06)', transform: 'translateY(-1px)' },
      }}
    >
      <Typography
        variant="caption"
        component="span"
        sx={{
          display: 'block',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontWeight: 800,
          fontSize: 10,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          lineHeight: 1.6,
          color: '#fff',
        }}
      >
        {event.customerName}
      </Typography>
    </Box>
  );
}

export default function MonthGrid({ referenceDate, events, onEventClick }: MonthGridProps) {
  const monthStart = referenceDate.startOf('month');
  const monthEnd = referenceDate.endOf('month');
  const gridStart = startOfWeekMonday(monthStart);
  const gridEnd = startOfWeekMonday(monthEnd).add(6, 'day');

  const [overflowAnchor, setOverflowAnchor] = useState<{ element: HTMLElement; key: string } | null>(null);
  const [detailEvent, setDetailEvent] = useState<{ event: CalendarEvent; element: HTMLElement } | null>(null);

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dayjs(event.eventDate).format('YYYY-MM-DD');
    const list = eventsByDate.get(key) ?? [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  const days: Dayjs[] = [];
  for (let day = gridStart; !day.isAfter(gridEnd); day = day.add(1, 'day')) {
    days.push(day);
  }

  const today = dayjs().format('YYYY-MM-DD');
  const overflowEvents = overflowAnchor ? (eventsByDate.get(overflowAnchor.key) ?? []) : [];

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1.25 }}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Typography
            key={label.short}
            variant="caption"
            color="text.secondary"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              // Weekends sit back: they read as the edge of the week rather than as working days.
              color: index >= 5 ? 'text.disabled' : undefined,
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              {label.full}
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              {label.short}
            </Box>
          </Typography>
        ))}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {days.map((day, index) => {
          const key = day.format('YYYY-MM-DD');
          const dayEvents = eventsByDate.get(key) ?? [];
          const inMonth = day.isSame(monthStart, 'month');
          const isToday = key === today;
          const isWeekend = day.day() === 0 || day.day() === 6;
          const isLastColumn = (index + 1) % 7 === 0;
          const isLastRow = index >= days.length - 7;

          return (
            <Box
              key={key}
              sx={{
                minHeight: 128,
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: isWeekend && inMonth ? 'background.default' : 'background.paper',
                opacity: inMonth ? 1 : 0.4,
                borderRight: isLastColumn ? 0 : 1,
                borderBottom: isLastRow ? 0 : 1,
                borderColor: 'divider',
                outline: isToday ? '1.5px solid' : 'none',
                outlineColor: 'primary.main',
                outlineOffset: -1.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 0.75 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: isToday ? 'primary.main' : 'transparent',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isToday ? 800 : 600,
                      fontSize: 12,
                      color: isToday ? 'primary.contrastText' : isWeekend ? 'text.secondary' : 'text.primary',
                    }}
                  >
                    {day.format('D')}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
                {dayEvents.slice(0, MAX_VISIBLE_PER_DAY).map((event) => (
                  <EventPill key={event.id} event={event} onClick={(element) => setDetailEvent({ event, element })} />
                ))}
                {dayEvents.length > MAX_VISIBLE_PER_DAY && (
                  <Typography
                    variant="caption"
                    color="primary"
                    onClick={(clickEvent) =>
                      setOverflowAnchor({ element: clickEvent.currentTarget as HTMLElement, key })
                    }
                    sx={{ cursor: 'pointer', fontWeight: 600, px: 0.75, '&:hover': { textDecoration: 'underline' } }}
                  >
                    +{dayEvents.length - MAX_VISIBLE_PER_DAY} more
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Popover
        open={Boolean(overflowAnchor)}
        anchorEl={overflowAnchor?.element}
        onClose={() => setOverflowAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack spacing={0.75} sx={{ p: 1.5, minWidth: 220 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
            {overflowAnchor ? dayjs(overflowAnchor.key).format('D MMMM YYYY') : ''}
          </Typography>
          {overflowEvents.map((event) => (
            <EventPill
              key={event.id}
              event={event}
              onClick={(element) => {
                setOverflowAnchor(null);
                setDetailEvent({ event, element });
              }}
            />
          ))}
        </Stack>
      </Popover>

      <EventDetailCard
        event={detailEvent?.event ?? null}
        anchorEl={detailEvent?.element ?? null}
        onClose={() => setDetailEvent(null)}
        onViewOrder={(event) => {
          setDetailEvent(null);
          onEventClick(event);
        }}
      />
    </Box>
  );
}
