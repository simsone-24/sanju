import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
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
 * One line from `md` up: the controls share the row equally (they set no widths of their own — the
 * bar sizes them), capped so a tab with a single filter doesn't stretch it across the page, and
 * floored so a tab with four doesn't crush them. Below `md` there isn't room for that and they
 * wrap onto as many rows as they need.
 *
 * Carries the Clear control the tabs previously had no equivalent of — with four filters on some
 * reports, getting back to an unfiltered view meant emptying each field by hand.
 */
export function ReportFilterBar({ children, onClear, active }: ReportFilterBarProps) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 2.5 }, mb: 2.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}
      >
        <FilterAltOutlinedIcon
          aria-hidden
          sx={{ fontSize: 20, color: 'text.secondary', flexShrink: 0, display: { xs: 'none', md: 'block' } }}
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flex: '1 1 auto',
            minWidth: 0,
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            '& > *': {
              flex: { xs: '1 1 200px', md: '1 1 0' },
              minWidth: { md: 150 },
              maxWidth: { md: 320 },
            },
          }}
        >
          {children}
        </Box>

        <Button size="small" startIcon={<RestartAltIcon />} onClick={onClear} disabled={!active} sx={{ flexShrink: 0 }}>
          Clear
        </Button>
      </Box>
    </Paper>
  );
}
