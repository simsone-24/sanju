import type { ButtonHTMLAttributes, ReactNode } from 'react';

// Tailwind button primitive (see tailwind.config.js for why utilities are `tw-` prefixed).
// Preflight is disabled, so a bare <button> keeps the browser's default chrome — every visual
// property (background, border, font, cursor) has to be stated explicitly here rather than
// relying on a reset.
export type ButtonVariant = 'primary' | 'outlined' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const BASE = [
  'tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap',
  'tw-rounded-control tw-font-sans tw-font-semibold tw-leading-none',
  'tw-transition-colors tw-duration-150',
  'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-brand/40',
  'disabled:tw-cursor-not-allowed disabled:tw-opacity-45',
].join(' ');

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'tw-border tw-border-transparent tw-bg-brand tw-text-white tw-shadow-sm hover:tw-bg-brand-dark disabled:hover:tw-bg-brand',
  outlined:
    'tw-border tw-border-hairline dark:tw-border-hairline-dark tw-bg-white dark:tw-bg-surface-dark tw-text-ink dark:tw-text-ink-dark hover:tw-bg-slate-50 dark:hover:tw-bg-slate-700',
  ghost: 'tw-border tw-border-transparent tw-bg-transparent tw-text-brand hover:tw-bg-brand/10',
  danger: 'tw-border tw-border-transparent tw-bg-danger tw-text-white hover:tw-bg-red-600',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'tw-h-8 tw-px-2.5 tw-text-xs',
  md: 'tw-h-9 tw-px-4 tw-text-[0.8125rem]',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export function Button({
  variant = 'outlined',
  size = 'md',
  startIcon,
  endIcon,
  className = '',
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[BASE, VARIANT[variant], SIZE[size], disabled ? '' : 'tw-cursor-pointer', className].join(' ')}
      {...rest}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
}
