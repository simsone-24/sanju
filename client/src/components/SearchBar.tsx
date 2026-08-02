import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  /** Stretch to fill the parent's width (e.g. a full-width toolbar row) instead of a fixed 260px. */
  fullWidth?: boolean;
  /** Called on Enter, after the pending debounce is flushed — e.g. to force an immediate refetch. */
  onSubmit?: () => void;
}

// Local state updates immediately (so typing feels instant); the onChange callback to the
// parent — which typically triggers a network request — is debounced.
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 400,
  fullWidth = false,
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
          'tw-h-9 tw-w-full tw-rounded-control tw-pl-9 tw-pr-3 tw-font-sans tw-text-[0.8125rem]',
          'tw-border tw-border-hairline dark:tw-border-hairline-dark',
          'tw-bg-white dark:tw-bg-surface-dark',
          'tw-text-ink dark:tw-text-ink-dark',
          'placeholder:tw-text-ink-muted dark:placeholder:tw-text-ink-dark-muted',
          'tw-transition-colors tw-duration-150',
          'hover:tw-border-slate-300 dark:hover:tw-border-slate-500',
          'focus:tw-border-brand focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-brand/20',
        ].join(' ')}
      />
    </div>
  );
}
