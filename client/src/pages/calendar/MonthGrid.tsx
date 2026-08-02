import { Box, Paper, Tooltip, Typography } from '@mui/material';
import dayjs, { type Dayjs } from 'dayjs';
import type { CalendarEvent } from '../../types/calendar';
import { CALENDAR_COLORS } from './calendarColors';
import { startOfWeekMonday } from './weekUtils';

interface MonthGridProps {
  referenceDate: Dayjs;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_VISIBLE_PER_DAY = 3;

export default function MonthGrid({ referenceDate, events, onEventClick }: MonthGridProps) {
  const monthStart = referenceDate.startOf('month');
  const monthEnd = referenceDate.endOf('month');
  const gridStart = startOfWeekMonday(monthStart);
  const gridEnd = startOfWeekMonday(monthEnd).add(6, 'day');

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

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {WEEKDAY_LABELS.map((label) => (
          <Typography key={label} variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontWeight: 600 }}>
            {label}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {days.map((day) => {
          const key = day.format('YYYY-MM-DD');
          const dayEvents = eventsByDate.get(key) ?? [];
          const inMonth = day.isSame(monthStart, 'month');
          const isToday = key === today;

          return (
            <Paper
              key={key}
              variant="outlined"
              sx={{
                minHeight: 96,
                p: 0.5,
                opacity: inMonth ? 1 : 0.4,
                borderColor: isToday ? 'primary.main' : undefined,
                borderWidth: isToday ? 2 : 1,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: isToday ? 700 : 400 }}>
                {day.format('D')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.5 }}>
                {dayEvents.slice(0, MAX_VISIBLE_PER_DAY).map((event) => (
                  <Tooltip key={event.id} title={`${event.orderNumber} — ${event.customerName}`}>
                    <Box
                      onClick={() => onEventClick(event)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        fontSize: 11,
                        overflow: 'hidden',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: CALENDAR_COLORS[event.color].hex,
                          flexShrink: 0,
                        }}
                      />
                      <Box component="span" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.orderNumber}
                      </Box>
                    </Box>
                  </Tooltip>
                ))}
                {dayEvents.length > MAX_VISIBLE_PER_DAY && (
                  <Typography variant="caption" color="text.secondary">
                    +{dayEvents.length - MAX_VISIBLE_PER_DAY} more
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
