import EventIcon from '@mui/icons-material/EventOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { StatusBadge } from '../../components/StatusBadge';
import type { CalendarEvent } from '../../types/calendar';
import { CALENDAR_COLORS } from './calendarColors';

interface DayListProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export default function DayList({ events, onEventClick }: DayListProps) {
  if (events.length === 0) {
    return (
      <Stack spacing={1} sx={{ alignItems: 'center', py: 6, color: 'text.disabled' }}>
        <EventIcon sx={{ fontSize: 40 }} />
        <Typography color="text.secondary">No events on this day.</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.25}>
      {events.map((event) => {
        const color = CALENDAR_COLORS[event.color];
        return (
          <Paper
            key={event.id}
            variant="outlined"
            sx={{
              p: 2,
              cursor: 'pointer',
              borderLeft: `4px solid ${color.hex}`,
              transition: 'box-shadow 120ms ease, background-color 120ms ease',
              '&:hover': { bgcolor: 'action.hover', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)' },
            }}
            onClick={() => onEventClick(event)}
          >
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {event.customerName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.eventName}
                </Typography>
                {event.venue && (
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5 }}>
                    <PlaceOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">
                      {event.venue}
                    </Typography>
                  </Stack>
                )}
              </Box>
              <StatusBadge type="order" status={event.status} />
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
