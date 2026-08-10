import { StageProgressTracker } from '../../components/StageProgressTracker';
import type { OrderStatus } from '../../types/order';
import type { OrderStageDates } from './orderActivity';
import { ORDER_STAGES, orderStage } from './orderStatusTransitions';

interface OrderProgressTrackerProps {
  status: OrderStatus;
  /**
   * When the order entered each stage, from its activity trail (see orderActivity.ts). Stages the
   * order skipped — or reached before status changes recorded their target — show an em dash.
   */
  stageDates: OrderStageDates;
}

// "md files/order/view.md" §Quick Progress Tracker — Yet to Start → In Progress → Order Closed,
// dated from the activity trail. REJECTED sits outside the sequence and gets the halted banner.
export function OrderProgressTracker({ status, stageDates }: OrderProgressTrackerProps) {
  const current = orderStage(status);

  if (current === 'REJECTED') {
    return (
      <StageProgressTracker
        stages={[]}
        currentIndex={-1}
        halted={{
          title: 'Order Rejected',
          description: 'This order is no longer progressing through the event workflow.',
        }}
      />
    );
  }

  return (
    <StageProgressTracker
      stages={ORDER_STAGES.map((stage) => ({ ...stage, date: stageDates[stage.key] }))}
      currentIndex={ORDER_STAGES.findIndex((stage) => stage.key === current)}
    />
  );
}
