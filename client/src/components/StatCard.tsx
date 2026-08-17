import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { ReactNode } from 'react';
import { STAT_TONE, type StatTone } from './statTone';

// Premium KPI tile (see tailwind.config.js for why utilities are `tw-` prefixed and coexist with
// MUI). Vertical dashboard card in the Stripe/Linear mould: small uppercase label with a tinted
// icon chip on the right, a large tabular number, and an optional trend line. A gradient top
// accent reveals on hover and stays on while the card is selected; hovering also lifts the card.
export type StatCardTone = StatTone;

/**
 * `md` is the hero tile a dashboard is built out of, where the counts are the page. `sm` is the
 * compact index-page tile — same anatomy about a fifth shorter, so a row of counts introduces a
 * table without pushing it off the fold.
 */
type StatCardSize = 'sm' | 'md';

interface StatCardSizeTokens {
  card: string;
  chip: string;
  label: string;
  valueRow: string;
  value: string;
  subtext: string;
  skeletonRow: string;
  skeletonBar: string;
}

const SIZE: Record<StatCardSize, StatCardSizeTokens> = {
  md: {
    card: 'tw-px-4 tw-py-3.5',
    chip: 'tw-h-9 tw-w-9',
    label: 'tw-text-[0.6875rem]',
    valueRow: 'tw-mt-2',
    value: 'tw-text-[1.75rem]',
    subtext: 'tw-mt-1.5 tw-text-xs',
    skeletonRow: 'tw-mt-3',
    skeletonBar: 'tw-h-7',
  },
  // The icon arrives from the caller as an MUI <SvgIcon>, whose own class fixes it at 1.5rem — the
  // descendant selector here outranks that so it scales down with the chip holding it.
  sm: {
    card: 'tw-px-3 tw-py-2.5',
    chip: 'tw-h-8 tw-w-8 [&_svg]:tw-h-[1.125rem] [&_svg]:tw-w-[1.125rem]',
    label: 'tw-text-[0.625rem]',
    valueRow: 'tw-mt-1.5',
    value: 'tw-text-xl',
    subtext: 'tw-mt-1 tw-text-[0.6875rem]',
    skeletonRow: 'tw-mt-2',
    skeletonBar: 'tw-h-5',
  },
};

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
  /** Defaults to the compact index-page tile; dashboards opt into the larger `md`. */
  size?: StatCardSize;
}

export function StatCard({
  label,
  value,
  icon,
  tone,
  subtext,
  onClick,
  selected = false,
  loading = false,
  size = 'sm',
}: StatCardProps) {
  const tones = STAT_TONE[tone];
  const sizes = SIZE[size];
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-pressed={interactive ? selected : undefined}
      className={[
        'tw-group tw-relative tw-flex tw-w-full tw-flex-col tw-overflow-hidden tw-rounded-card tw-border tw-text-left',
        sizes.card,
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
        <span
          className={`tw-min-w-0 tw-flex-1 tw-truncate tw-font-bold tw-uppercase tw-tracking-wide tw-text-ink-muted dark:tw-text-ink-dark-muted ${sizes.label}`}
        >
          {label}
        </span>
        <span
          className={[
            'tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-xl',
            sizes.chip,
            tones.chip,
          ].join(' ')}
        >
          {icon}
        </span>
      </div>

      {loading ? (
        <div className={`tw-space-y-2 ${sizes.skeletonRow}`}>
          <span
            className={`tw-block tw-w-16 tw-animate-pulse tw-rounded tw-bg-slate-200 dark:tw-bg-slate-600 ${sizes.skeletonBar}`}
          />
          <span className="tw-block tw-h-2.5 tw-w-24 tw-animate-pulse tw-rounded tw-bg-slate-100 dark:tw-bg-slate-700" />
        </div>
      ) : (
        <>
          <div className={`tw-flex tw-items-baseline tw-justify-between tw-gap-2 ${sizes.valueRow}`}>
            <span
              className={`tw-font-extrabold tw-leading-none tw-tabular-nums tw-text-ink dark:tw-text-ink-dark ${sizes.value}`}
            >
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
            <span
              className={`tw-block tw-truncate tw-text-ink-muted dark:tw-text-ink-dark-muted ${sizes.subtext}`}
            >
              {subtext}
            </span>
          )}
        </>
      )}
    </button>
  );
}
