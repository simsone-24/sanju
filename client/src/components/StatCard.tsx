import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { ReactNode } from 'react';
import { STAT_TONE, type StatTone } from './statTone';

// Premium KPI tile (see tailwind.config.js for why utilities are `tw-` prefixed and coexist with
// MUI). Vertical dashboard card in the Stripe/Linear mould: small uppercase label with a tinted
// icon chip on the right, a large tabular number, and an optional trend line. A gradient top
// accent reveals on hover and stays on while the card is selected; hovering also lifts the card.
export type StatCardTone = StatTone;

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone: StatCardTone;
  subtext?: string;
  /** Makes the card a filter toggle (index-page KPI tiles). */
  onClick?: () => void;
  /** Marks this card's filter as the active one. */
  selected?: boolean;
  /** Swaps the value/label for pulsing placeholders while the stats query is in flight. */
  loading?: boolean;
}

export function StatCard({ label, value, icon, tone, subtext, onClick, selected = false, loading = false }: StatCardProps) {
  const tones = STAT_TONE[tone];
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-pressed={interactive ? selected : undefined}
      className={[
        'tw-group tw-relative tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-card tw-border tw-px-4 tw-py-3.5 tw-text-left',
        'tw-bg-white dark:tw-bg-surface-dark',
        'tw-border-hairline dark:tw-border-hairline-dark',
        'tw-transition-all tw-duration-200',
        interactive ? 'tw-cursor-pointer hover:-tw-translate-y-0.5 hover:tw-shadow-lifted' : 'tw-cursor-default',
        selected ? `tw-ring-2 tw-shadow-lifted ${tones.ring}` : 'tw-shadow-card',
      ].join(' ')}
    >
      {/* Gradient top accent — always on for the selected card, revealed on hover otherwise. */}
      <span
        aria-hidden
        className={[
          'tw-absolute tw-inset-x-0 tw-top-0 tw-h-1 tw-bg-gradient-to-r tw-transition-opacity tw-duration-200',
          tones.accent,
          selected ? 'tw-opacity-100' : 'tw-opacity-0 group-hover:tw-opacity-100',
        ].join(' ')}
      />

      {/* Label + tinted icon chip on one line. */}
      <div className="tw-flex tw-items-center tw-gap-2">
        <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-text-[0.6875rem] tw-font-bold tw-uppercase tw-tracking-wide tw-text-ink-muted dark:tw-text-ink-dark-muted">
          {label}
        </span>
        <span
          className={[
            'tw-flex tw-h-9 tw-w-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-xl',
            tones.chip,
          ].join(' ')}
        >
          {icon}
        </span>
      </div>

      {loading ? (
        <div className="tw-mt-3 tw-space-y-2">
          <span className="tw-block tw-h-7 tw-w-16 tw-animate-pulse tw-rounded tw-bg-slate-200 dark:tw-bg-slate-600" />
          <span className="tw-block tw-h-2.5 tw-w-24 tw-animate-pulse tw-rounded tw-bg-slate-100 dark:tw-bg-slate-700" />
        </div>
      ) : (
        <>
          <div className="tw-mt-2 tw-flex tw-items-baseline tw-justify-between tw-gap-2">
            <span className="tw-text-[1.75rem] tw-font-extrabold tw-leading-none tw-tabular-nums tw-text-ink dark:tw-text-ink-dark">
              {value}
            </span>
            {/* Affordance that the tile is a filter toggle rather than a static readout — it nudges
                right on hover so the card reads as "go here". Decorative: the whole card is the button. */}
            {interactive && (
              <ChevronRightIcon
                aria-hidden
                fontSize="small"
                className="tw-shrink-0 tw-text-ink-muted tw-transition-transform tw-duration-200 group-hover:tw-translate-x-0.5 dark:tw-text-ink-dark-muted"
              />
            )}
          </div>
          {subtext && (
            <span className="tw-mt-1.5 tw-block tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
              {subtext}
            </span>
          )}
        </>
      )}
    </button>
  );
}
