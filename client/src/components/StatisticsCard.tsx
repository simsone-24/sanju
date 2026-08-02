import { Box, ButtonBase, Paper, Stack, Typography, type Theme } from '@mui/material';
import type { ReactNode } from 'react';

// Deliberately narrower than StatusBadgeColor — 'default' has no .light/.dark shade in the MUI
// theme palette, only the 6 real palette colors do. A literal hex is also accepted (used when the
// design calls for a specific hue the theme palette doesn't have a distinct token for, e.g.
// telling Pending/amber apart from Quotation To Share/yellow, both of which are "warning").
type StatisticsCardPaletteColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
type StatisticsCardColor = StatisticsCardPaletteColor | `#${string}`;

function paletteMain(theme: Theme, color: StatisticsCardPaletteColor): string {
  const palette = (theme.vars ?? theme).palette;
  switch (color) {
    case 'primary':
      return palette.primary.main;
    case 'secondary':
      return palette.secondary.main;
    case 'success':
      return palette.success.main;
    case 'error':
      return palette.error.main;
    case 'warning':
      return palette.warning.main;
    case 'info':
      return palette.info.main;
  }
}

interface StatisticsCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: StatisticsCardColor;
  subtext?: string;
  /** When provided, the card becomes clickable (used by dashboard summary cards that apply a filter on click). */
  onClick?: () => void;
  /** Highlights the card as the active filter — toggled off by clicking it again. */
  selected?: boolean;
}

// Used for Dashboard widgets (Today's Events, Pending Quotations, Revenue, etc. per
// docs/03_MODULES.md §2) and similar KPI displays elsewhere, as well as clickable filter summary
// cards (e.g. Enquiry list's Pending Appointments / In Progress / Quotation To Share cards).
export function StatisticsCard({ label, value, icon, color = 'primary', subtext, onClick, selected }: StatisticsCardProps) {
  const isHex = color.startsWith('#');

  const content = (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
      {icon && (
        <Box
          sx={(theme) => {
            const hue = isHex ? color : paletteMain(theme, color as StatisticsCardPaletteColor);
            return {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: isHex ? `color-mix(in srgb, ${hue} 18%, transparent)` : `${color}.light`,
              color: isHex ? hue : `${color}.dark`,
              flexShrink: 0,
            };
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ textAlign: 'left' }}>
        <Typography variant="h2">{value}</Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {subtext && (
          <Typography variant="caption" color="text.secondary">
            {subtext}
          </Typography>
        )}
      </Box>
    </Stack>
  );

  return (
    <Paper
      variant="outlined"
      sx={(theme) => {
        const hue = isHex ? color : paletteMain(theme, color as StatisticsCardPaletteColor);
        return {
          p: 3,
          transition: 'box-shadow 200ms ease, transform 200ms ease, border-color 200ms ease',
          ...(onClick && { cursor: 'pointer' }),
          ...(selected && {
            borderColor: hue,
            borderWidth: 2,
            bgcolor: `color-mix(in srgb, ${hue} 8%, transparent)`,
          }),
          '&:hover': { boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)', transform: 'translateY(-2px)' },
        };
      }}
    >
      {onClick ? (
        <ButtonBase
          onClick={onClick}
          sx={{ width: '100%', borderRadius: 1, textAlign: 'left', display: 'block' }}
          aria-pressed={selected}
        >
          {content}
        </ButtonBase>
      ) : (
        content
      )}
    </Paper>
  );
}
