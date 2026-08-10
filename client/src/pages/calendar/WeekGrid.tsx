import { Box, Stack, Typography } from '@mui/material';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import type { CalendarEvent } from '../../types/calendar';
import { CALENDAR_COLORS } from './calendarColors';
import EventDetailCard from './EventDetailCard';
import { startOfWeekMonday } from './weekUtils';

interface WeekGridProps {
  referenceDate: Dayjs;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export default function WeekGrid({ referenceDate, events, onEventClick }: WeekGridProps) {
  const weekStart = startOfWeekMonday(referenceDate);
  const days = Array.from({ length: 7 }, (_, index) => weekStart.add(index, 'day'));

  const [detailEvent, setDetailEvent] = useState<{ event: CalendarEvent; element: HTMLElement } | null>(null);

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dayjs(event.eventDate).format('YYYY-MM-DD');
    const list = eventsByDate.get(key) ?? [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Box>
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
          const isToday = key === today;
          const isWeekend = day.day() === 0 || day.day() === 6;
          const isLastColumn = index === days.length - 1;

          return (
            <Box
              key={key}
              sx={{
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                borderRight: isLastColumn ? 0 : 1,
                borderColor: 'divider',
                outline: isToday ? '1.5px solid' : 'none',
                outlineColor: 'primary.main',
                outlineOffset: -1.5,
              }}
            >
              <Box
                sx={{
                  px: 1,
                  py: 0.75,
                  bgcolor: isToday ? 'primary.main' : isWeekend ? 'background.default' : 'transparent',
                  borderBottom: 1,
                  borderColor: 'divider',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: isToday ? 'primary.contrastText' : 'text.secondary', fontWeight: 600 }}>
                  {day.format('ddd').toUpperCase()}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: isToday ? 'primary.contrastText' : 'text.primary' }}
                >
                  {day.format('D MMM')}
                </Typography>
              </Box>
              <Stack spacing={0.75} sx={{ p: 1, flex: 1 }}>
                {dayEvents.map((event) => {
                  const color = CALENDAR_COLORS[event.color];
                  return (
                    <Box
                      key={event.id}
                      onClick={(clickEvent) => setDetailEvent({ event, element: clickEvent.currentTarget })}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        px: 0.75,
                        py: 0.5,
                        bgcolor: color.hex,
                        transition: 'filter 120ms ease',
                        '&:hover': { filter: 'brightness(0.94)' },
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#fff' }}>
                        {event.customerName}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.85)' }}>
                        {event.eventName}
                      </Typography>
                    </Box>
                  );
                })}
                {dayEvents.length === 0 && (
                  <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', mt: 2 }}>
                    No events
                  </Typography>
                )}
              </Stack>
            </Box>
          );
        })}
      </Box>

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
