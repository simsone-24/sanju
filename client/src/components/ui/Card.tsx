import type { ReactNode } from 'react';

// The app's standard raised panel: white (slate in dark mode), hairline border, soft lift.
// Used for filter toolbars, table containers, and any page-level content block.
export const CARD_SURFACE =
  'tw-rounded-card tw-border tw-border-hairline dark:tw-border-hairline-dark tw-bg-white dark:tw-bg-surface-dark tw-shadow-lifted';

interface CardProps {
  children: ReactNode;
  /** Adds the standard internal padding. Off for cards whose children own their own padding (e.g. a table). */
  padded?: boolean;
  className?: string;
}

export function Card({ children, padded = false, className = '' }: CardProps) {
  return <div className={[CARD_SURFACE, padded ? 'tw-p-4' : '', className].join(' ')}>{children}</div>;
}
