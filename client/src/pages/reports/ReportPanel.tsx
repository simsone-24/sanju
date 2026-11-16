import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface ReportPanelProps {
  icon: ReactNode;
  title: string;
  /** Right-aligned in the header row — a count, a hint, a button. */
  action?: ReactNode;
  children: ReactNode;
}

// A titled surface for one block of a report — the results table, or a breakdown. Matches the cards
// on the Orders and Enquiry detail pages so the whole app reads as one product.
export function ReportPanel({ icon, title, action, children }: ReportPanelProps) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '12px', p: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', rowGap: 1 }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box sx={{ display: 'flex', color: 'text.secondary' }}>{icon}</Box>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Stack>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}
