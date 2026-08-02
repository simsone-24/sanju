import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface InfoLineProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

interface InfoCardProps {
  title: ReactNode;
  /** Rendered in a tinted circle to the left of the title. */
  icon?: ReactNode;
  /** Right-aligned in the header row — for a section's primary action button. */
  action?: ReactNode;
  /** Pinned to the bottom so cards sitting side by side in a grid end flush. */
  footer?: ReactNode;
  children: ReactNode;
}

// One labelled block inside an information card. Icon-led per "md files/order/view.md"
// §Design Improvements ("use icon for every information block"): a caption label above a semibold
// value, both left aligned, so values line up down the card instead of wrapping ragged-right.
export function InfoLine({ icon, label, value }: InfoLineProps) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Box
        sx={{
          mt: 0.25,
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          color: 'text.secondary',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" component="div" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

// Shell for a titled block of InfoLines. height: 100% plus the mt: 'auto' footer keeps sibling
// cards in a CSS grid the same height with their footers aligned.
export function InfoCard({ title, icon, action, footer, children }: InfoCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', rowGap: 1 }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          {icon && (
            <Box
              sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                flexShrink: 0,
                color: 'primary.main',
                backgroundColor: `color-mix(in srgb, ${(theme.vars ?? theme).palette.primary.main} 12%, transparent)`,
              })}
            >
              {icon}
            </Box>
          )}
          <Typography variant="h4" component="div" sx={{ minWidth: 0 }}>
            {title}
          </Typography>
        </Stack>
        {action}
      </Stack>

      <Stack spacing={2}>{children}</Stack>

      {footer && <Box sx={{ mt: 'auto', pt: 2 }}>{footer}</Box>}
    </Paper>
  );
}
