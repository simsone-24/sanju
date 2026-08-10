import type { SxProps, Theme } from '@mui/material';

// The KPI row every report tab opens its results with. auto-fit rather than a fixed column count:
// the tabs carry two, three or no tiles, and each should fill the row it is given.
export const STAT_ROW_SX: SxProps<Theme> = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' },
  mb: 2.5,
};
