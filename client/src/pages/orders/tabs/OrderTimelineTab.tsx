import { useQuery } from '@tanstack/react-query';
import { CircularProgress } from '@mui/material';
import { AppTimeline } from '../../../components/Timeline';
import * as orderService from '../../../services/orderService';

interface OrderTimelineTabProps {
  orderId: string;
}

export default function OrderTimelineTab({ orderId }: OrderTimelineTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['order-timeline', orderId],
    queryFn: () => orderService.getTimeline(orderId),
  });

  if (isLoading) return <CircularProgress size={28} />;

  return <AppTimeline entries={data ?? []} emptyMessage="No activity recorded for this order yet." />;
}
