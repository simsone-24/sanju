import { resolveStatusConfig, type StatusBadgeType } from './statusConfig';

export type StatusBadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  type: StatusBadgeType;
  status: string;
  /** Overrides the configured label (e.g. a page-specific phrasing) while keeping the status's color. */
  label?: string;
  /** `sm` shrinks the badge for narrow table columns; `md` is the default used on detail pages. */
  size?: StatusBadgeSize;
}

const SIZE: Record<StatusBadgeSize, string> = {
  sm: 'tw-h-[1.125rem] tw-px-1.5 tw-text-[0.5625rem]',
  md: 'tw-h-6 tw-px-2 tw-text-[0.6875rem]',
};

// Soft, tinted, pill-shaped badges per 06_UI_UX_GUIDELINES.md §12 status colours: the badge
// text/border take the semantic hue while the fill is the same hue at low opacity, so the badge
// reads clearly on both the light and dark surfaces without the heaviness of a solid chip.
//
// The hue is a CSS variable (index.css) rather than a Tailwind class because it's resolved at
// runtime from the status value — Tailwind only emits classes it can see at build time — and
// because the variable already tracks the active colour scheme.
export function StatusBadge({ type, status, label: labelOverride, size = 'md' }: StatusBadgeProps) {
  const { label, color } = resolveStatusConfig(type, status);
  const hue = color.startsWith('#') ? color : `var(--status-${color})`;
  const text = labelOverride ?? label;

  return (
    <span
      // The badge truncates inside narrow status columns, so the full label stays reachable on
      // hover rather than being lost to the ellipsis.
      title={text}
      className={`tw-inline-flex tw-max-w-full tw-items-center tw-rounded-full tw-border tw-font-bold tw-uppercase tw-leading-none tw-tracking-[0.02em] ${SIZE[size]}`}
      style={{
        color: hue,
        backgroundColor: `color-mix(in srgb, ${hue} 16%, transparent)`,
        borderColor: `color-mix(in srgb, ${hue} 38%, transparent)`,
      }}
    >
      <span className="tw-truncate">{text}</span>
    </span>
  );
}
