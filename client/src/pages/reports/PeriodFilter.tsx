import { Box, InputLabel, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { ReportPeriod } from './useReportPeriod';

interface PeriodFilterProps {
  period: ReportPeriod;
  /** Called after any change, so a tab can return its table to page 1. */
  onChange?: () => void;
}

/**
 * The Monthly / Yearly toggle with the matching month or year picker. Rendered as sibling
 * controls so they sit in a ReportFilterBar row like any other filter.
 */
export function PeriodFilter({ period, onChange }: PeriodFilterProps) {
  return (
    <>
      {/* One click to switch, and both choices stay visible. Exclusive: a view is always selected,
          so clicking the active one (which MUI reports as null) is ignored.
          Laid out like the fields beside it: the theme puts every field label in a block above its
          box (never on the border), so "View" uses the same InputLabel and the same 40px box, which
          puts both boxes on one line. */}
      <Box>
        <InputLabel htmlFor="report-view-toggle">View</InputLabel>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          color="primary"
          value={period.view}
          id="report-view-toggle"
          aria-label="Report view"
          onChange={(_event, value: ReportPeriod['view'] | null) => {
            if (!value) return;
            period.setView(value);
            onChange?.();
          }}
          sx={{
            '& .MuiToggleButton-root': {
              height: 40,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'action.disabled',
            },
          }}
        >
          <ToggleButton value="MONTHLY">Monthly</ToggleButton>
          <ToggleButton value="YEARLY">Yearly</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {period.view === 'MONTHLY' ? (
        <DatePicker
          label="Month"
          views={['year', 'month']}
          openTo="month"
          format="MMM YYYY"
          value={period.month}
          onChange={(value) => {
            if (value?.isValid()) {
              period.setMonth(value.startOf('month'));
              onChange?.();
            }
          }}
          slotProps={{ textField: { size: 'small' } }}
        />
      ) : (
        <DatePicker
          label="Year"
          views={['year']}
          openTo="year"
          format="YYYY"
          value={period.year}
          onChange={(value) => {
            if (value?.isValid()) {
              period.setYear(value.startOf('year'));
              onChange?.();
            }
          }}
          slotProps={{ textField: { size: 'small' } }}
        />
      )}
    </>
  );
}
