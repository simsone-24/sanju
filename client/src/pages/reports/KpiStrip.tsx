import { Box, ButtonBase, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type KpiTone = 'positive' | 'due';

export interface KpiChip {
  label: string;
  count: number;
  /** Marks this chip's filter as the one in force. */
  selected?: boolean;
  /** Omitted for a count that is shown but cannot be filtered on. */
  onClick?: () => void;
}

export interface KpiItem {
  label: string;
  value: ReactNode;
  /** One short line under the number, or several (each on its own line). */
  subtext?: string | string[];
  /** Money in reads green, money still owed reads red; everything else stays the default colour. */
  tone?: KpiTone;
  /** Counts shown as chips along the foot of the card — clickable ones act as filters. */
  chips?: KpiChip[];
  /** Makes the figure itself a filter toggle (e.g. "show everything"). */
  onClick?: () => void;
  /** Marks the card's own filter as the one in force. */
  selected?: boolean;
}

interface KpiStripProps {
  items: KpiItem[];
  loading?: boolean;
}

const TONE_COLOR: Record<KpiTone | 'default', 'success' | 'error' | 'primary'> = {
  positive: 'success',
  due: 'error',
  default: 'primary',
};

/**
 * A report's headline numbers as a row of compact cards: a coloured accent edge, a label, a figure
 * and short notes. Colour means one of two things (collected / owed); everything else is the brand
 * colour.
 *
 * A card that is a filter (`onClick`) shows a ring while it is the one in force, the same way the
 * summary cards on the Orders and Enquiry lists do, and then opens to show its status `chips` —
 * clickable ones narrow the report further.
 */
export function KpiStrip({ items, loading = false }: KpiStripProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        mb: 2.5,
        // Cards in a row share one height (the grid default), so the row always reads as even — even
        // while one card is open showing its chips.
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: `repeat(${items.length}, minmax(0, 1fr))` },
      }}
    >
      {items.map((item) => {
        const color = TONE_COLOR[item.tone ?? 'default'];
        const subtextLines = (Array.isArray(item.subtext) ? item.subtext : [item.subtext]).filter(
          (line): line is string => Boolean(line),
        );

        const figure = (
          <>
            <Typography
              variant="caption"
              sx={{ display: 'block', fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}
              color="text.secondary"
            >
              {item.label}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width="60%" sx={{ fontSize: '1.375rem' }} />
            ) : (
              <Typography
                component="div"
                noWrap
                sx={{
                  fontSize: '1.375rem',
                  fontWeight: 800,
                  lineHeight: 1.25,
                  fontVariantNumeric: 'tabular-nums',
                  color: item.tone ? `${color}.dark` : 'text.primary',
                }}
              >
                {item.value}
              </Typography>
            )}
            {subtextLines.map((line) => (
              <Typography key={line} variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {line}
              </Typography>
            ))}
          </>
        );

        return (
          <Paper
            key={item.label}
            variant="outlined"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              overflow: 'hidden',
              borderRadius: '12px',
              borderTop: 3,
              borderTopColor: `${color}.main`,
              ...(item.selected && { outline: 2, outlineStyle: 'solid', outlineColor: `${color}.main` }),
              transition: 'box-shadow 150ms ease',
              ...(item.onClick && { '&:hover': { boxShadow: 2 } }),
            }}
          >
            {item.onClick ? (
              <ButtonBase
                onClick={item.onClick}
                aria-pressed={item.selected}
                sx={{ display: 'block', width: '100%', textAlign: 'left', px: 2, py: 1.25 }}
              >
                {figure}
              </ButtonBase>
            ) : (
              <Box sx={{ px: 2, py: 1.25 }}>{figure}</Box>
            )}

            {/* A card that is itself a filter keeps its chips tucked away until it is the one open;
                a plain card (no onClick) always shows them. */}
            {item.chips && item.chips.length > 0 && (!item.onClick || item.selected) && (
              <Stack direction="row" sx={{ px: 2, pb: 1.25, gap: 0.75, flexWrap: 'wrap' }}>
                {item.chips.map((chip) => (
                  <Chip
                    key={chip.label}
                    size="small"
                    color={chip.selected ? color : 'default'}
                    variant={chip.selected ? 'filled' : 'outlined'}
                    label={`${chip.count} ${chip.label}`}
                    onClick={chip.onClick}
                    aria-pressed={chip.onClick ? Boolean(chip.selected) : undefined}
                    sx={{ fontWeight: 600, ...(chip.onClick ? {} : { cursor: 'default' }) }}
                  />
                ))}
              </Stack>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
