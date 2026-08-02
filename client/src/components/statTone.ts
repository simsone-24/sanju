// Shared color vocabulary for the StatCard KPI tiles used across the index pages, so their tones
// can't drift apart. Static class strings per tone — Tailwind only emits classes it can see at
// build time, so these can't be interpolated from a variable.
export type StatTone = 'slate' | 'cyan' | 'green' | 'blue' | 'amber' | 'orange' | 'yellow' | 'violet' | 'red';

export interface StatToneClasses {
  /** Tinted icon chip background + icon color. */
  chip: string;
  /** Gradient stops for the hover/selected accent bar. */
  accent: string;
  /** Focus/selected ring color. */
  ring: string;
}

export const STAT_TONE: Record<StatTone, StatToneClasses> = {
  slate: {
    chip: 'tw-bg-slate-100 tw-text-slate-600 dark:tw-bg-slate-500/20 dark:tw-text-slate-300',
    accent: 'tw-from-slate-400 tw-to-slate-500',
    ring: 'tw-ring-slate-400/60',
  },
  cyan: {
    chip: 'tw-bg-cyan-50 tw-text-cyan-600 dark:tw-bg-cyan-500/20 dark:tw-text-cyan-300',
    accent: 'tw-from-cyan-400 tw-to-cyan-600',
    ring: 'tw-ring-cyan-500/60',
  },
  green: {
    chip: 'tw-bg-emerald-50 tw-text-emerald-600 dark:tw-bg-emerald-500/20 dark:tw-text-emerald-300',
    accent: 'tw-from-emerald-400 tw-to-emerald-600',
    ring: 'tw-ring-emerald-500/60',
  },
  blue: {
    chip: 'tw-bg-blue-50 tw-text-blue-600 dark:tw-bg-blue-500/20 dark:tw-text-blue-300',
    accent: 'tw-from-blue-400 tw-to-blue-600',
    ring: 'tw-ring-blue-500/60',
  },
  amber: {
    chip: 'tw-bg-amber-50 tw-text-amber-600 dark:tw-bg-amber-500/20 dark:tw-text-amber-300',
    accent: 'tw-from-amber-400 tw-to-amber-600',
    ring: 'tw-ring-amber-500/60',
  },
  orange: {
    chip: 'tw-bg-orange-50 tw-text-orange-600 dark:tw-bg-orange-500/20 dark:tw-text-orange-300',
    accent: 'tw-from-orange-400 tw-to-orange-600',
    ring: 'tw-ring-orange-500/60',
  },
  yellow: {
    chip: 'tw-bg-yellow-50 tw-text-yellow-600 dark:tw-bg-yellow-500/20 dark:tw-text-yellow-300',
    accent: 'tw-from-yellow-400 tw-to-yellow-600',
    ring: 'tw-ring-yellow-500/60',
  },
  violet: {
    chip: 'tw-bg-violet-50 tw-text-violet-600 dark:tw-bg-violet-500/20 dark:tw-text-violet-300',
    accent: 'tw-from-violet-400 tw-to-violet-600',
    ring: 'tw-ring-violet-500/60',
  },
  // Reserved for genuinely negative metrics (rejected/lost), not merely urgent ones — those are
  // amber/orange.
  red: {
    chip: 'tw-bg-red-50 tw-text-red-600 dark:tw-bg-red-500/20 dark:tw-text-red-300',
    accent: 'tw-from-red-400 tw-to-red-600',
    ring: 'tw-ring-red-500/60',
  },
};
