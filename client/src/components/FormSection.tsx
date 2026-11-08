import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  /** Optional leading icon, shown in a tinted round chip in place of the plain accent bar. */
  icon?: ReactNode;
  /** DOM id, so a link can open the page scrolled to this section (see useScrollToAnchor). */
  id?: string;
  children: ReactNode;
}

// md files/UI-2.md "Form Sections": group fields into cards (Customer Information, Event
// Information, Payment Details, ...) instead of one long unbroken form.
export function FormSection({ title, subtitle, icon, id, children }: FormSectionProps) {
  return (
    <Paper id={id} variant="outlined" sx={{ p: { xs: 2, sm: 3.5 } }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, mb: { xs: 2, sm: 2.5 } }}>
        {icon ? (
          <Box
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 34, sm: 40 },
              height: { xs: 34, sm: 40 },
              borderRadius: '50%',
              flexShrink: 0,
              color: 'primary.main',
              backgroundColor: `color-mix(in srgb, ${(theme.vars ?? theme).palette.primary.main} 12%, transparent)`,
            })}
          >
            {icon}
          </Box>
        ) : (
          <Box sx={{ width: 4, height: 20, borderRadius: 999, bgcolor: 'primary.main', flexShrink: 0 }} />
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, sm: 2.5 },
          // minmax(0, …) lets long values and wide inputs shrink instead of stretching the card.
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}
