import { useQuery } from '@tanstack/react-query';
import { CircularProgress } from '@mui/material';
import { AppTimeline, type TimelineEntry } from '../../../components/Timeline';
import * as orderService from '../../../services/orderService';
import type { OrderTimelineEntry } from '../../../types/order';
import { formatCurrency } from '../../../utils/format';

interface OrderTimelineTabProps {
  orderId: number;
}

// A budget change is the only UPDATE entry that records { from, to, reason }, with amounts as
// numbers (status changes carry text). Anything else — including budget entries logged before the
// reason was recorded — keeps its plain description.
function toTimelineEntry(entry: OrderTimelineEntry): TimelineEntry {
  const { from, to, reason } = entry.metadata ?? {};
  if (entry.action === 'UPDATE' && typeof from === 'number' && typeof to === 'number' && typeof reason === 'string') {
    return {
      ...entry,
      action: 'BUDGET CHANGE',
      details: [
        { label: 'Old amount', value: formatCurrency(from) },
        { label: 'New amount', value: formatCurrency(to) },
        { label: 'Change', value: `${to >= from ? '+' : '-'} ${formatCurrency(Math.abs(to - from))}` },
        { label: 'Reason', value: reason },
      ],
    };
  }
  return entry;
}

export default function OrderTimelineTab({ orderId }: OrderTimelineTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['order-timeline', orderId],
    queryFn: () => orderService.getTimeline(orderId),
  });

  if (isLoading) return <CircularProgress size={28} />;

  return <AppTimeline entries={(data ?? []).map(toTimelineEntry)} emptyMessage="No activity recorded for this order yet." />;
}
