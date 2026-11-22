import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Box, Button, Paper } from '@mui/material';
import type { ReactNode } from 'react';

interface ReportFilterBarProps {
  children: ReactNode;
  /** Resets every filter this report offers. */
  onClear: () => void;
  /** True while at least one filter is set — the only time clearing does anything. */
  active: boolean;
}

/**
 * The filter row every report tab opens with, on its own surface so the controls read as one group
 * rather than floating above the results.
 *
 * Controls keep a fixed, compact width and sit together on the left — a bar with only a Monthly /
 * Yearly toggle and a month picker no longer stretches them across the whole page. They wrap onto
 * further rows when the screen is too narrow, and fill the width on a phone. Clear sits at the far
 * end, and stays out of the way (disabled) until a filter has been changed.
 */
export function ReportFilterBar({ children, onClear, active }: ReportFilterBarProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        // Same corner radius and side padding as ReportPanel and KpiStrip, so the three stacked
        // blocks share one left edge and one set of corners.
        borderRadius: '12px',
        px: { xs: 2, sm: 2.5 },
        py: 1.5,
        mb: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        flexWrap: 'wrap',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          // Top-aligned rather than centred: a control that grows (an Autocomplete with a value, a
          // helper line) must not drag its neighbours off the shared top edge.
          alignItems: 'flex-start',
          gap: 1.5,
          flexWrap: 'wrap',
          flex: '1 1 auto',
          minWidth: 0,
          '& > *': {
            flex: { xs: '1 1 100%', sm: '0 1 200px' },
            minWidth: 0,
          },
        }}
      >
        {children}
      </Box>

      <Button
        size="small"
        color="inherit"
        startIcon={<RestartAltIcon fontSize="small" />}
        onClick={onClear}
        disabled={!active}
        // 40px, the height of the controls beside it, so it sits on their centre line.
        sx={{ flexShrink: 0, height: 40, px: 1.5, color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
      >
        Reset
      </Button>
    </Paper>
  );
}
