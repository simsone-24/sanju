import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface ViewFieldProps {
  label: string;
  value: string;
  /** Calls out a figure that needs attention — an outstanding balance, say. */
  tone?: 'warning' | 'success';
}

// One read-only figure inside a ViewFieldGroup: caption above value, never an editable-looking
// input for something the form cannot change.
export function ViewField({ label, value, tone }: ViewFieldProps) {
  const color = tone === 'warning' ? 'warning.main' : tone === 'success' ? 'success.dark' : 'text.primary';
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, color, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

interface ViewFieldGroupProps {
  /** Columns on sm and up; always one column on the narrowest screens. */
  columns?: number;
  children: ReactNode;
}

// The tinted panel a form puts its read-only context in — the record being edited, stated once at
// the top so the fields below have something to be about. Shared so every such panel in the app
// reads the same (Order Details' Edit Order, Payments' Add Payment).
export function ViewFieldGroup({ columns = 3, children }: ViewFieldGroupProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: `repeat(${columns}, minmax(0, 1fr))` },
      }}
    >
      {children}
    </Box>
  );
}
