import { Box, Paper, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import type { CalendarEvent } from '../../types/calendar';
import { CALENDAR_COLORS } from './calendarColors';

interface EventListPanelProps {
  title: string;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

// Right-hand rail listing every order in the period currently shown by the Month/Week grid. The
// grid shows *where* an order's event date falls; this answers "what's on, and when."
//
// One saturated card per event, each carrying its own day number — so the rail is readable as a
// standalone agenda, and an event's colour ties it back to the pill sitting in the grid. That
// replaces the earlier sticky date headers: with the date on the card itself, the group header was
// saying the same thing twice.
export default function EventListPanel({ title, events, onEventClick }: EventListPanelProps) {
  const sorted = [...events].sort((a, b) => dayjs(a.eventDate).diff(dayjs(b.eventDate)));
  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Box
      sx={{
        width: { xs: '100%', lg: 320 },
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 660,
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1.25, px: 0.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {events.length} order{events.length === 1 ? '' : 's'}
        </Typography>
      </Stack>

      <Stack spacing={1.25} sx={{ overflowY: 'auto', flex: 1, pr: 0.5, pb: 0.5 }}>
        {sorted.length === 0 && (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.disabled">
              No orders in this period.
            </Typography>
          </Paper>
        )}

        {sorted.map((event) => {
          const color = CALENDAR_COLORS[event.color];
          const eventDate = dayjs(event.eventDate);
          const isToday = eventDate.format('YYYY-MM-DD') === today;

          return (
            <Box
              key={event.id}
              role="button"
              tabIndex={0}
              onClick={() => onEventClick(event)}
              onKeyDown={(keyEvent) => {
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                  keyEvent.preventDefault();
                  onEventClick(event);
                }
              }}
              sx={{
                cursor: 'pointer',
                borderRadius: 2,
                p: 1.5,
                bgcolor: color.hex,
                color: '#fff',
                flexShrink: 0,
                // Today gets a halo rather than a different colour — the colour already means the
                // order's status and can't be borrowed to mean something else.
                boxShadow: isToday
                  ? `0 0 0 2px var(--mui-palette-background-paper), 0 0 0 4px ${color.hex}`
                  : '0 8px 18px -12px rgba(15, 23, 42, 0.65)',
                transition: 'transform 120ms ease, filter 120ms ease',
                '&:hover': { filter: 'brightness(1.06)', transform: 'translateY(-1px)' },
                '&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2 },
              }}
            >
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Typography
                  component="span"
                  sx={{ fontSize: 34, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', flexShrink: 0 }}
                >
                  {eventDate.format('D')}
                </Typography>
                <Typography
                  component="span"
                  noWrap
                  sx={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', minWidth: 0 }}
                >
                  {event.customerName}
                </Typography>
              </Stack>

              <Typography component="p" noWrap sx={{ mt: 1, fontSize: 12, fontWeight: 700, opacity: 0.95 }}>
                {eventDate.format('dddd, D MMMM YYYY')}
                {isToday ? ' · Today' : ''}
              </Typography>
              <Typography component="p" noWrap sx={{ fontSize: 12, opacity: 0.85 }}>
                {event.eventName}
                {event.venue ? ` · ${event.venue}` : ''}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
