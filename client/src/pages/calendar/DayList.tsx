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
    return <Typography color="text.secondary">No events on this day.</Typography>;
  }

  return (
    <Stack spacing={1}>
      {events.map((event) => (
        <Paper
          key={event.id}
          variant="outlined"
          sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
          onClick={() => onEventClick(event)}
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: CALENDAR_COLORS[event.color].hex, flexShrink: 0 }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {event.orderNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.customerName}
                  {event.venue ? ` — ${event.venue}` : ''}
                </Typography>
              </Box>
            </Stack>
            <StatusBadge type="order" status={event.status} />
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
