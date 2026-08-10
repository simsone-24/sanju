import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Box, Button, Divider, Popover, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import type { CalendarEvent } from '../../types/calendar';
import { CALENDAR_COLORS } from './calendarColors';

interface EventDetailCardProps {
  event: CalendarEvent | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onViewOrder: (event: CalendarEvent) => void;
}

// Floating preview card shown on clicking an event bar in the Month/Week grids — mirrors the
// requested "event card" pattern (name, date, note-equivalent, invitee-equivalent) while still
// respecting docs/06_UI_UX_GUIDELINES.md §16's "Click Event -> Open Order Details" via the button.
export default function EventDetailCard({ event, anchorEl, onClose, onViewOrder }: EventDetailCardProps) {
  const color = event ? CALENDAR_COLORS[event.color] : null;

  return (
    <Popover
      open={Boolean(anchorEl && event)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      slotProps={{ paper: { sx: { borderRadius: 4, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)' } } }}
    >
      {event && color && (
        <Box sx={{ width: 280, p: 2.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, pr: 1 }}>
              {event.eventName}
            </Typography>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color.hex, flexShrink: 0 }} />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {dayjs(event.eventDate).format('D MMMM YYYY')}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: 'text.disabled' }}>
                CUSTOMER
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                {event.customerName}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.06em', color: 'text.disabled' }}>
                VENUE
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.25 }}>
                <PlaceOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <Typography variant="body2">{event.venue || 'Not set'}</Typography>
              </Stack>
            </Box>
          </Stack>

          <Button fullWidth variant="contained" size="small" sx={{ mt: 2.5 }} onClick={() => onViewOrder(event)}>
            View Order Details
          </Button>
        </Box>
      )}
    </Popover>
  );
}
