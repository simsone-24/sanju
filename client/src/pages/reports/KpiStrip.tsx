import { Box, Paper, Skeleton, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface KpiItem {
  label: string;
  value: ReactNode;
  /** One short line under the number. */
  subtext?: string;
  /** Money in reads green, money still owed reads red; everything else stays the default ink. */
  tone?: 'positive' | 'due';
}

interface KpiStripProps {
  items: KpiItem[];
  loading?: boolean;
}

/**
 * A report's headline numbers on one flat strip — a label, a large figure and a short note per
 * item, separated by hairlines — in place of a row of separate tinted cards. No icons or fills: the
 * figures carry the weight, and colour is kept for the two things it means (collected / owed).
 */
export function KpiStrip({ items, loading = false }: KpiStripProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: '12px',
        mb: 2.5,
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: `repeat(${items.length}, minmax(0, 1fr))` },
        overflow: 'hidden',
      }}
    >
      {items.map((item, index) => (
        <Box
          key={item.label}
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            minWidth: 0,
            borderLeft: { md: index > 0 ? 1 : 0 },
            borderTop: { xs: index > 1 ? 1 : 0, md: 0 },
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {item.label}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width="60%" sx={{ fontSize: '1.5rem' }} />
          ) : (
            <Typography
              component="div"
              noWrap
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                lineHeight: 1.25,
                fontVariantNumeric: 'tabular-nums',
                color: item.tone === 'positive' ? 'success.dark' : item.tone === 'due' ? 'error.dark' : 'text.primary',
              }}
            >
              {item.value}
            </Typography>
          )}
          {item.subtext && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>
              {item.subtext}
            </Typography>
          )}
        </Box>
      ))}
    </Paper>
  );
}
