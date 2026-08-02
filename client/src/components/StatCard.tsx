import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { ReactNode } from 'react';
import { STAT_TONE, type StatTone } from './statTone';

// Tailwind-built KPI tile (see tailwind.config.js for why utilities are `tw-` prefixed and
// coexist with MUI). Richer than the MUI StatisticsCard it supersedes on index pages: a tinted
// icon chip, a gradient top accent that reveals on hover, a lift+shadow transition, and an
// optional trend line — all per "md files/Quotation/ui1.md" §Dashboard Summary Cards.
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
  /** Swaps the value/label for pulsing placeholders while the stats query is in flight
   * ("md files/Enquiry/indexUI.md" §Loading State — skeletons on cards, never a blank page). */
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
        'tw-group tw-relative tw-w-full tw-overflow-hidden tw-rounded-card tw-border tw-px-3.5 tw-py-2.5 tw-text-left',
        'tw-bg-white dark:tw-bg-surface-dark',
        'tw-border-hairline dark:tw-border-hairline-dark',
        'tw-transition-all tw-duration-200',
        interactive ? 'tw-cursor-pointer hover:-tw-translate-y-1 hover:tw-shadow-lifted' : 'tw-cursor-default',
        selected ? `tw-ring-2 ${tones.ring}` : 'tw-shadow-card',
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

      <div className="tw-flex tw-items-center tw-gap-3">
        <span
          className={`tw-flex tw-h-9 tw-w-9 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full ${tones.chip}`}
        >
          {icon}
        </span>
        <span className="tw-min-w-0 tw-flex-1">
          {loading ? (
            <>
              <span className="tw-mb-1 tw-block tw-h-5 tw-w-10 tw-animate-pulse tw-rounded tw-bg-slate-200 dark:tw-bg-slate-600" />
              <span className="tw-block tw-h-3 tw-w-24 tw-animate-pulse tw-rounded tw-bg-slate-100 dark:tw-bg-slate-700" />
            </>
          ) : (
            <>
              <span className="tw-block tw-truncate tw-text-lg tw-font-bold tw-leading-tight tw-text-ink dark:tw-text-ink-dark">
                {value}
              </span>
              <span className="tw-block tw-truncate tw-text-[0.8125rem] tw-leading-tight tw-text-ink-muted dark:tw-text-ink-dark-muted">
                {label}
              </span>
              {subtext && (
                <span className="tw-mt-0.5 tw-block tw-truncate tw-text-[0.6875rem] tw-leading-tight tw-text-ink-muted dark:tw-text-ink-dark-muted">
                  {subtext}
                </span>
              )}
            </>
          )}
        </span>

        {/* Affordance that the tile is a filter toggle rather than a static KPI readout — it nudges
            right on hover so the card reads as "go here". Decorative: the whole card is the button. */}
        {interactive && (
          <span
            aria-hidden
            className={[
              'tw-flex tw-h-7 tw-w-7 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full',
              'tw-bg-slate-100 tw-text-slate-500 dark:tw-bg-slate-700 dark:tw-text-slate-300',
              'tw-transition-transform tw-duration-200 group-hover:tw-translate-x-0.5',
            ].join(' ')}
          >
            <ChevronRightIcon fontSize="small" />
          </span>
        )}
      </div>
    </button>
  );
}
