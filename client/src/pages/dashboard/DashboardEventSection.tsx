import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Divider, Paper, Skeleton, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import type { CalendarEvent } from '../../types/calendar';

// How many events a card shows before it has to be expanded.
const COLLAPSED_COUNT = 5;

interface DashboardEventSectionProps {
  title: string;
  subtitle: string;
  events: CalendarEvent[] | undefined;
  loading: boolean;
  onEventClick: (event: CalendarEvent) => void;
}

// Compact per-period agenda card for the Dashboard: plain detail rows (date, customer, event
// type, mahal name, mahal location) rather than the Calendar page's status-coloured event cards.
//
// The card grows to fit what it shows rather than scrolling inside a fixed height: a scrollbar on a
// card this small hides the very events it holds, and gives no clue how many are down there. The
// overflow is behind an explicit toggle instead, which names the count it is hiding.
export default function DashboardEventSection({ title, subtitle, events, loading, onEventClick }: DashboardEventSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const sorted = [...(events ?? [])].sort((a, b) => dayjs(a.eventDate).diff(dayjs(b.eventDate)));
  const hidden = Math.max(0, sorted.length - COLLAPSED_COUNT);
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.75,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {sorted.length}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.25 }}>
        {subtitle}
      </Typography>

      <Stack divider={<Divider />}>
        {loading &&
          [0, 1, 2].map((index) => <Skeleton key={index} variant="rounded" height={56} sx={{ my: 0.5 }} />)}

        {!loading && sorted.length === 0 && (
          <Box sx={{ py: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.disabled">
              No events
            </Typography>
          </Box>
        )}

        {!loading &&
          visible.map((event) => {
            const eventDate = dayjs(event.eventDate);

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
                  borderRadius: 1,
                  py: 0.75,
                  px: 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                  '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                  <Typography component="span" sx={{ fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
                    {eventDate.format('D MMM')}
                  </Typography>
                  <Typography component="span" noWrap sx={{ fontSize: 12.5, fontWeight: 700, minWidth: 0, flex: 1 }}>
                    {event.customerName}
                  </Typography>
                  <StatusBadge type="order" status={event.status} size="sm" />
                </Stack>
                <Typography component="p" noWrap sx={{ fontSize: 11.5, color: 'text.secondary', mt: 0.25 }}>
                  {event.eventType}
                  {event.eventTime ? ` · ${event.eventTime === 'MORNING' ? 'Morning' : 'Evening'}` : ''}
                </Typography>
                <Typography component="p" noWrap sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                  {event.mahal || '—'}
                  {event.venue ? ` · ${event.venue}` : ''}
                </Typography>
              </Box>
            );
          })}
      </Stack>

      {/* Names the count it is hiding, so a collapsed card still says how much more there is. */}
      {!loading && hidden > 0 && (
        <Button
          size="small"
          fullWidth
          onClick={() => setExpanded((previous) => !previous)}
          aria-expanded={expanded}
          endIcon={
            <ExpandMoreIcon
              fontSize="small"
              sx={{
                transition: 'transform 200ms ease',
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
            />
          }
          sx={{ mt: 0.75, fontSize: 12, fontWeight: 700 }}
        >
          {expanded ? 'Show less' : `Show ${hidden} more`}
        </Button>
      )}
    </Paper>
  );
}
