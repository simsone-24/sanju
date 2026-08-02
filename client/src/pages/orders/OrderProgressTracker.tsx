import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import type { OrderStatus } from '../../types/order';
import { ORDER_STAGES, orderStage } from './orderStatusTransitions';

// "md files/order/view.md" §Quick Progress Tracker — Planning Created → Work Started → Event
// Completed with the current stage highlighted. CANCELLED sits outside the sequence (an order
// doesn't progress *into* cancellation) and replaces the tracker with a red banner instead.
export function OrderProgressTracker({ status }: { status: OrderStatus }) {
  const current = orderStage(status);

  if (current === 'CANCELLED') {
    return (
      <div className="tw-mb-4 tw-flex tw-items-center tw-gap-3 tw-rounded-card tw-border tw-border-red-300 tw-bg-red-50 tw-p-4 dark:tw-border-red-500/40 dark:tw-bg-red-500/10">
        <span className="tw-flex tw-h-9 tw-w-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-red-100 tw-text-red-600 dark:tw-bg-red-500/20 dark:tw-text-red-300">
          <CancelIcon fontSize="small" />
        </span>
        <span>
          <span className="tw-block tw-text-sm tw-font-bold tw-text-red-700 dark:tw-text-red-300">Order Cancelled</span>
          <span className="tw-block tw-text-xs tw-text-red-600/80 dark:tw-text-red-300/70">
            This order is no longer progressing through the event workflow.
          </span>
        </span>
      </div>
    );
  }

  const currentIndex = ORDER_STAGES.findIndex((stage) => stage.key === current);

  return (
    <div className="tw-mb-4 tw-rounded-card tw-border tw-border-hairline tw-bg-white tw-p-5 dark:tw-border-hairline-dark dark:tw-bg-surface-dark">
      <div className="tw-flex tw-items-center">
        {ORDER_STAGES.map((stage, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <div key={stage.key} className="tw-flex tw-flex-1 tw-items-center last:tw-flex-none">
              <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2.5">
                <span
                  className={[
                    'tw-flex tw-h-9 tw-w-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-sm tw-font-bold tw-transition-colors',
                    done
                      ? 'tw-bg-emerald-500 tw-text-white'
                      : active
                        ? 'tw-bg-blue-600 tw-text-white tw-ring-4 tw-ring-blue-500/20'
                        : 'tw-bg-slate-100 tw-text-slate-400 dark:tw-bg-slate-500/20 dark:tw-text-slate-400',
                  ].join(' ')}
                >
                  {done ? <CheckIcon sx={{ fontSize: 18 }} /> : index + 1}
                </span>
                <span
                  className={[
                    'tw-truncate tw-text-sm',
                    active
                      ? 'tw-font-bold tw-text-ink dark:tw-text-ink-dark'
                      : done
                        ? 'tw-font-medium tw-text-ink dark:tw-text-ink-dark'
                        : 'tw-text-ink-muted dark:tw-text-ink-dark-muted',
                  ].join(' ')}
                >
                  {stage.label}
                </span>
              </div>

              {index < ORDER_STAGES.length - 1 && (
                <span
                  aria-hidden
                  className={`tw-mx-3 tw-h-0.5 tw-flex-1 tw-rounded ${
                    done ? 'tw-bg-emerald-500' : 'tw-bg-slate-200 dark:tw-bg-slate-600'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
