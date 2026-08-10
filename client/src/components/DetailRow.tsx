import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  /** A plain string is styled for you; pass an element (a badge, say) to render it as-is. */
  value: ReactNode;
  /** Widen the label column where labels are long, so values still line up down the card. */
  labelWidth?: number;
}

/**
 * Label and value on one line, with the labels aligned down a card so the values form a column.
 *
 * The counterpart to InfoLine, which stacks value under label — this one is for the dense
 * two-column detail cards on the Orders, Payment Tracker and Enquiry detail pages.
 */
export function DetailRow({ icon, label, value, labelWidth = 132 }: DetailRowProps) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', color: 'text.secondary', width: labelWidth, flexShrink: 0, pt: 0.125 }}
      >
        <Box sx={{ display: 'flex', color: 'text.disabled' }}>{icon}</Box>
        <Typography variant="caption">{label}</Typography>
      </Stack>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {typeof value === 'string' ? (
          <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
            {value}
          </Typography>
        ) : (
          value
        )}
      </Box>
    </Stack>
  );
}

interface CardSectionProps {
  icon: ReactNode;
  title: string;
  tone?: 'primary' | 'success' | 'warning' | 'info';
  children: ReactNode;
}

// A titled block inside a card — the tinted circular icon marks where one subject ends and the next
// begins, so two subjects can share a card without needing two frames.
export function CardSection({ icon, title, tone = 'primary', children }: CardSectionProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
        <Box
          sx={(theme) => ({
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `${tone}.main`,
            backgroundColor: `color-mix(in srgb, ${(theme.vars ?? theme).palette[tone].main} 12%, transparent)`,
          })}
        >
          {icon}
        </Box>
        <Typography variant="h4" component="h3">
          {title}
        </Typography>
      </Stack>
      <Stack spacing={1.75}>{children}</Stack>
    </Box>
  );
}
