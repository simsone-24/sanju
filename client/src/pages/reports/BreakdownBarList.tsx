import { Box, Stack, Typography } from '@mui/material';

interface BreakdownBarListProps {
  items: { label: string; value: number; displayValue: string }[];
}

// No charting library is installed in this app (no recharts/chart.js/@mui/x-charts) — for two
// small aggregate breakdowns (payment method / order status counts) a plain proportional bar list
// covers the documented "visual breakdown" need without adding a new dependency.
export function BreakdownBarList({ items }: BreakdownBarListProps) {
  const max = Math.max(1, ...items.map((item) => item.value));

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data for the selected filters.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <Box key={item.label}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="body2">{item.label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.displayValue}
            </Typography>
          </Stack>
          <Box sx={{ height: 6, borderRadius: 1, bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${(item.value / max) * 100}%`, bgcolor: 'primary.main' }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
