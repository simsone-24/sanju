import RefreshIcon from '@mui/icons-material/Refresh';
import { useEffect, useState } from 'react';

interface LastUpdatedProps {
  /** Epoch millis of the last successful fetch — TanStack Query's `dataUpdatedAt` (0 before the first one lands). */
  timestamp: number;
  /** Spins the icon while a background refetch is in flight. */
  refreshing?: boolean;
  /** Makes the indicator a button that triggers a refetch. Read-only text when omitted. */
  onRefresh?: () => void;
}

// The label ages on its own between fetches, so it has to re-render on a timer rather than only
// when `timestamp` changes. 30s is fine-grained enough for a minute-resolution label.
const TICK_MS = 30_000;

function relativeLabel(timestamp: number): string {
  if (!timestamp) return 'Loading…';
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`;
}

// Data-freshness indicator for index-page headers: tells the user how stale the table is and
// doubles as a refresh control, so "is this current?" never needs a full page reload.
export function LastUpdated({ timestamp, refreshing = false, onRefresh }: LastUpdatedProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((previous) => previous + 1), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const interactive = Boolean(onRefresh);
  const label = relativeLabel(timestamp);

  const content = (
    <>
      <RefreshIcon
        aria-hidden
        fontSize="small"
        style={{ animation: refreshing ? 'data-table-spin 900ms linear infinite' : undefined }}
      />
      <span className="tw-whitespace-nowrap tw-text-[0.8125rem]">{label}</span>
    </>
  );

  const className = [
    'tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border-0 tw-bg-transparent tw-px-2.5 tw-py-1',
    'tw-font-sans tw-text-ink-muted dark:tw-text-ink-dark-muted tw-transition-colors tw-duration-200',
  ].join(' ');

  if (!interactive) return <div className={className}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onRefresh}
      title="Refresh data"
      className={[
        className,
        'tw-cursor-pointer hover:tw-bg-slate-100 hover:tw-text-ink dark:hover:tw-bg-slate-700 dark:hover:tw-text-ink-dark',
        'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-brand/40',
      ].join(' ')}
    >
      {content}
    </button>
  );
}
