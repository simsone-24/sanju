import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  /** Stretch to fill the parent's width (e.g. a full-width toolbar row) instead of a fixed 260px. */
  fullWidth?: boolean;
  /** Compact height for dense filter rows where the control sits beside sm-size selects. */
  size?: 'sm' | 'md';
  /** Called on Enter, after the pending debounce is flushed — e.g. to force an immediate refetch. */
  onSubmit?: () => void;
}

const SEARCH_SIZE = {
  sm: 'tw-h-7 tw-pl-8 tw-pr-2.5 tw-text-[0.8125rem]',
  md: 'tw-h-10 tw-pl-9 tw-pr-3 tw-text-[0.8125rem]',
} as const;

// Local state updates immediately (so typing feels instant); the onChange callback to the
// parent — which typically triggers a network request — is debounced.
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 400,
  fullWidth = false,
  size = 'md',
  onSubmit,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) onChange(localValue);
    }, debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue, debounceMs]);

  return (
    <div className={`tw-relative ${fullWidth ? 'tw-w-full' : 'tw-w-[260px]'}`}>
      <SearchIcon
        aria-hidden
        fontSize="small"
        className="tw-pointer-events-none tw-absolute tw-left-2.5 tw-top-1/2 -tw-translate-y-1/2 tw-text-ink-muted dark:tw-text-ink-dark-muted"
      />
      <input
        type="search"
        value={localValue}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => setLocalValue(event.target.value)}
        // Enter shouldn't wait out the debounce — apply what's typed straight away.
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          if (localValue !== value) onChange(localValue);
          onSubmit?.();
        }}
        className={[
          SEARCH_SIZE[size],
          'tw-w-full tw-rounded-control tw-font-sans',
          'tw-border tw-border-hairline dark:tw-border-hairline-dark',
          'tw-bg-white dark:tw-bg-surface-dark',
          // Filter controls read in slate rather than the near-black used for table data, so the
          // toolbar sits a step back from the rows it filters.
          'tw-text-slate-600 dark:tw-text-ink-dark',
          'placeholder:tw-text-ink-muted dark:placeholder:tw-text-ink-dark-muted',
          'tw-transition-colors tw-duration-150',
          'hover:tw-border-slate-300 dark:hover:tw-border-slate-500',
          'focus:tw-border-brand focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-brand/20',
        ].join(' ')}
      />
    </div>
  );
}
