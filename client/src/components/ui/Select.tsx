import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useId } from 'react';

// Native <select> styled with Tailwind: the browser keeps the popup (so it stays keyboard- and
// touch-native) while `appearance-none` lets the trigger match the app's other controls. The label
// sits above the box rather than floating inside it, so a row of filters bottom-aligns cleanly.
export interface SelectOption {
  value: string;
  label: string;
}

type SelectSize = 'sm' | 'md';

const SIZE: Record<SelectSize, string> = {
  sm: 'tw-h-7 tw-pl-2 tw-pr-7 tw-text-xs',
  md: 'tw-h-9 tw-pl-3 tw-pr-9 tw-text-[0.8125rem]',
};

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label?: string;
  /** Label for the empty ("") value, rendered as the first option — e.g. "All". Omit to require a choice. */
  emptyLabel?: string;
  size?: SelectSize;
  /** Accessible name when no visible `label` is rendered (e.g. the rows-per-page control). */
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectField({
  value,
  onChange,
  options,
  label,
  emptyLabel,
  size = 'md',
  ariaLabel,
  className = '',
  disabled = false,
}: SelectFieldProps) {
  const id = useId();

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="tw-mb-1 tw-block tw-text-xs tw-font-medium tw-text-ink-muted dark:tw-text-ink-dark-muted"
        >
          {label}
        </label>
      )}
      <div className="tw-relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          aria-label={label ? undefined : ariaLabel}
          onChange={(event) => onChange(event.target.value)}
          className={[
            'tw-w-full tw-appearance-none tw-rounded-control tw-font-sans tw-font-medium',
            'tw-border tw-border-hairline dark:tw-border-hairline-dark',
            'tw-bg-white dark:tw-bg-surface-dark',
            'tw-text-ink dark:tw-text-ink-dark',
            'tw-transition-colors tw-duration-150',
            'hover:tw-border-slate-300 dark:hover:tw-border-slate-500',
            'focus:tw-border-brand focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-brand/20',
            'disabled:tw-cursor-not-allowed disabled:tw-opacity-50',
            disabled ? '' : 'tw-cursor-pointer',
            SIZE[size],
          ].join(' ')}
        >
          {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <KeyboardArrowDownIcon
          aria-hidden
          className="tw-pointer-events-none tw-absolute tw-right-2 tw-top-1/2 -tw-translate-y-1/2 tw-text-ink-muted dark:tw-text-ink-dark-muted"
          fontSize="small"
        />
      </div>
    </div>
  );
}
