import type { CalendarColor } from '../../types/calendar';

// docs/03_MODULES.md §5 / docs/06_UI_UX_GUIDELINES.md §16's 5-color legend. Deliberately separate
// from components/statusConfig.ts's ORDER_STATUS_CONFIG (which maps status -> MUI Chip semantic
// colors like "info"/"warning") — this table renders the literal GREEN/BLUE/ORANGE/RED/GREY value
// the backend already computed (server/src/modules/calendar/service.ts's STATUS_COLOR), it does
// not re-derive color from order status itself.
export const CALENDAR_COLORS: Record<CalendarColor, { label: string; hex: string }> = {
  GREEN: { label: 'Completed', hex: '#22C55E' },
  BLUE: { label: 'Upcoming', hex: '#2563EB' },
  ORANGE: { label: 'Planning', hex: '#F59E0B' },
  RED: { label: 'Payment Pending', hex: '#EF4444' },
  GREY: { label: 'Cancelled', hex: '#6B7280' },
};
