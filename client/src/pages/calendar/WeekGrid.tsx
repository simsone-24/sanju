import { Box, Paper, Stack, Typography } from '@mui/material';
import dayjs, { type Dayjs } from 'dayjs';
import type { CalendarEvent } from '../../types/calendar';
import { CALENDAR_COLORS } from './calendarColors';
import { startOfWeekMonday } from './weekUtils';

interface WeekGridProps {
  referenceDate: Dayjs;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export default function WeekGrid({ referenceDate, events, onEventClick }: WeekGridProps) {
  const weekStart = startOfWeekMonday(referenceDate);
  const days = Array.from({ length: 7 }, (_, index) => weekStart.add(index, 'day'));

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dayjs(event.eventDate).format('YYYY-MM-DD');
    const list = eventsByDate.get(key) ?? [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
      {days.map((day) => {
        const key = day.format('YYYY-MM-DD');
        const dayEvents = eventsByDate.get(key) ?? [];
        const isToday = key === today;

        return (
          <Paper
            key={key}
            variant="outlined"
            sx={{
              minHeight: 200,
              p: 1,
              borderColor: isToday ? 'primary.main' : undefined,
              borderWidth: isToday ? 2 : 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {day.format('ddd')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: isToday ? 700 : 500, mb: 1 }}>
              {day.format('D MMM')}
            </Typography>
            <Stack spacing={0.75}>
              {dayEvents.map((event) => (
                <Box
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                >
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: CALENDAR_COLORS[event.color].hex, flexShrink: 0 }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {event.orderNumber}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 1.5 }}>
                    {event.customerName}
                  </Typography>
                </Box>
              ))}
              {dayEvents.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  No events
                </Typography>
              )}
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}
