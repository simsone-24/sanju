import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  subtitle?: string;
  /** Optional leading icon, shown in a tinted round chip in place of the plain accent bar. */
  icon?: ReactNode;
  /** DOM id, so a link can open the page scrolled to this section (see useScrollToAnchor). */
  id?: string;
  /**
   * Opts the card into the numbered premium style: a step badge, a divider under the header and a
   * softer, rounder surface. Pages that do not pass it keep the plain card.
   */
  step?: number;
  children: ReactNode;
}

// md files/UI-2.md "Form Sections": group fields into cards (Customer Information, Event
// Information, Payment Details, ...) instead of one long unbroken form.
export function FormSection({ title, subtitle, icon, id, step, children }: FormSectionProps) {
  if (step !== undefined) {
    return (
      <Paper
        id={id}
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: '20px',
          // Clears the sticky page header when the section navigator scrolls here.
          scrollMarginTop: '88px',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 28px -16px rgba(15, 23, 42, 0.14)',
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: 'center', gap: 2, pb: { xs: 2, sm: 2.5 }, mb: { xs: 2.5, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}
        >
          <Box
            aria-hidden
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: 'primary.contrastText',
              backgroundColor: 'primary.main',
              boxShadow: '0 6px 14px -6px rgba(37, 99, 235, 0.55)',
            }}
          >
            {step}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h4">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && <Box sx={{ display: { xs: 'none', sm: 'flex' }, color: 'text.disabled' }}>{icon}</Box>}
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 2, sm: 2.5 },
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {children}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper id={id} variant="outlined" sx={{ p: { xs: 2, sm: 3.5 }, scrollMarginTop: '88px' }}>
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
