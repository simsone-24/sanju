import { Box, Divider, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface HeaderFact {
  icon: ReactNode;
  label: string;
  value: string;
}

export interface HeaderFigure {
  label: string;
  value: string;
  /** Money that has come in reads green, money still owed reads red. */
  tone?: 'positive' | 'due';
}

interface RecordHeaderCardProps {
  /** Sits in a tinted rounded tile, naming the kind of record at a glance. */
  icon: ReactNode;
  /** Small uppercase line above the title — "ORDER", "PAYMENT TRACKER". */
  eyebrow: string;
  title: string;
  /** Status badge shown beside the title. */
  badge?: ReactNode;
  /** Buttons for this record, right-aligned on the title row. */
  actions?: ReactNode;
  facts: HeaderFact[];
  figures?: HeaderFigure[];
}

// One labelled fact in the meta strip: icon-led caption above the value, per
// "md files/order/view.md" §Design Improvements ("use icon for every information block").
function MetaField({ icon, label, value }: HeaderFact) {
  return (
    <Box sx={{ minWidth: 0, px: { xs: 0, sm: 2.5 }, py: 0.25 }}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary', mb: 0.5 }}>
        {icon}
        <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="body2"
        title={value}
        sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {value}
      </Typography>
    </Box>
  );
}

// Money is colour-coded but never by colour alone — each figure keeps its own label. The darker
// palette steps are deliberate: the mid steps are mark colours and don't carry enough contrast for
// text on a white surface.
function MoneyField({ label, value, tone }: HeaderFigure) {
  const color = tone === 'positive' ? 'success.dark' : tone === 'due' ? 'error.dark' : 'text.primary';
  return (
    <Box sx={{ px: { xs: 0, sm: 2.5 }, py: 0.25 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * The header a record's detail page opens with ("md files/order/view.md" §Header Section):
 * identity and status on the top row beside the actions, then one strip of the facts the rest of
 * the page is read against, with the money right-aligned.
 *
 * Shared so Order Details and the Payment Tracker read as one product rather than two pages that
 * happen to show similar things.
 */
export function RecordHeaderCard({ icon, eyebrow, title, badge, actions, facts, figures = [] }: RecordHeaderCardProps) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 3 }, mb: 2 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 2 }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            sx={(theme) => ({
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              backgroundColor: `color-mix(in srgb, ${(theme.vars ?? theme).palette.primary.main} 12%, transparent)`,
            })}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              {eyebrow}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
              <Typography variant="h2" component="h1" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              {badge}
            </Stack>
          </Box>
        </Stack>

        {actions && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {actions}
          </Stack>
        )}
      </Stack>

      <Divider sx={{ my: 2.5 }} />

      {/* One strip — the facts on the left, the money on the right — wrapping onto its own rows on
          narrow screens rather than squeezing every value into a scrollable line. */}
      <Stack
        direction="row"
        sx={{
          alignItems: 'stretch',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 2,
          columnGap: { xs: 3, sm: 0 },
        }}
      >
        <Stack
          direction="row"
          divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
          sx={{ flexWrap: 'wrap', rowGap: 2, columnGap: { xs: 3, sm: 0 }, minWidth: 0 }}
        >
          {facts.map((fact) => (
            <MetaField key={fact.label} {...fact} />
          ))}
        </Stack>

        {figures.length > 0 && (
          <Stack
            direction="row"
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
            sx={{ flexWrap: 'wrap', rowGap: 2, columnGap: { xs: 3, sm: 0 } }}
          >
            {figures.map((figure) => (
              <MoneyField key={figure.label} {...figure} />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
