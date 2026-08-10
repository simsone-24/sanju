import type { ReactNode } from 'react';

// Fully-rounded pills sized to sit comfortably against the toolbar's inputs, with a solid brand
// fill and a soft shadow when active. Shared by every index page with a quick-range date filter
// (Enquiries, Payment Tracker, ...) so the interaction and styling stay identical per page.
interface QuickFilterPillProps {
  label: string;
  active: boolean;
  icon?: ReactNode;
  onClick: () => void;
}

export function QuickFilterPill({ label, active, icon, onClick }: QuickFilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'tw-inline-flex tw-h-8 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-px-3.5',
        'tw-font-sans tw-text-xs tw-font-semibold',
        'tw-transition-all tw-duration-200 hover:-tw-translate-y-px',
        'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-brand/40',
        active
          ? 'tw-border-transparent tw-bg-brand tw-text-white tw-shadow-sm'
          : 'tw-border-hairline tw-bg-white tw-text-slate-600 hover:tw-border-brand/30 hover:tw-text-ink dark:tw-border-hairline-dark dark:tw-bg-surface-dark dark:tw-text-ink-dark dark:hover:tw-border-brand-light/40 dark:hover:tw-text-ink-dark',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}
