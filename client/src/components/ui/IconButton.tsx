import type { ButtonHTMLAttributes, ReactNode } from 'react';

// Compact circular icon button for table toolbars and row actions. `title` doubles as the
// tooltip and the accessible name, so callers never need a separate aria-label.
// Sizes are a fixed set rather than something a caller overrides through `className`: Tailwind
// orders utilities by scale value, not by the order they appear in the class attribute, so a
// `tw-h-5` passed in would lose to the built-in `tw-h-8`.
type IconButtonSize = 'xs' | 'sm' | 'md';

const SIZE: Record<IconButtonSize, string> = {
  xs: 'tw-h-5 tw-w-5',
  sm: 'tw-h-8 tw-w-8',
  md: 'tw-h-9 tw-w-9',
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  size?: IconButtonSize;
  children: ReactNode;
}

export function IconButton({ title, size = 'md', className = '', disabled, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      className={[
        'tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0',
        'tw-text-ink-muted dark:tw-text-ink-dark-muted',
        'tw-transition-colors tw-duration-150',
        'hover:tw-bg-slate-100 hover:tw-text-ink dark:hover:tw-bg-slate-700 dark:hover:tw-text-ink-dark',
        'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-brand/40',
        'disabled:tw-cursor-not-allowed disabled:tw-opacity-45',
        disabled ? '' : 'tw-cursor-pointer',
        SIZE[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
