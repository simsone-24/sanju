import { Box, Stack, Typography } from '@mui/material';

interface BreakdownBarListProps {
  items: { label: string; value: number; displayValue: string }[];
  /**
   * `value` (default) puts the largest first — right for a categorical split, where the reader
   * wants to know what dominates. `given` keeps the caller's order, which a time series needs:
   * months must read left-to-right in time, not by size.
   */
  order?: 'value' | 'given';
}

/**
 * A magnitude breakdown — how one total splits across a handful of categories.
 *
 * No charting library is installed in this app (no recharts/chart.js/@mui/x-charts), and none is
 * needed: for a few categories a proportional bar list beats a pie, since the bars share a baseline
 * and can be read against each other directly. One measure, so one hue — the bars carry length,
 * not identity, and the labels carry the names.
 *
 * Bars are scaled to the largest value (so the biggest category fills the row and the rest read as
 * fractions of it) while the caption states each one's share of the total.
 */
export function BreakdownBarList({ items, order = 'value' }: BreakdownBarListProps) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data for the selected filters.
      </Typography>
    );
  }

  const ordered = order === 'value' ? [...items].sort((a, b) => b.value - a.value) : items;
  const max = Math.max(1, ...ordered.map((item) => item.value));
  const total = ordered.reduce((sum, item) => sum + item.value, 0);

  return (
    <Stack spacing={1.75}>
      {ordered.map((item) => {
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
        return (
          <Box key={item.label}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
                {item.label}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', flexShrink: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {item.displayValue}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {share}%
                </Typography>
              </Stack>
            </Stack>
            <Box sx={{ height: 8, borderRadius: 999, bgcolor: 'action.hover', overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${(item.value / max) * 100}%`,
                  minWidth: item.value > 0 ? 8 : 0,
                  borderRadius: 999,
                  bgcolor: 'primary.main',
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
