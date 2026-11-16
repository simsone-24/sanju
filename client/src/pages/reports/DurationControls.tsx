import { MenuItem, Stack, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import { DURATION_OPTIONS, type Duration } from './reportDuration';

interface DurationControlsProps {
  duration: Duration;
  onDurationChange: (duration: Duration) => void;
  customMonth: Dayjs;
  onCustomMonthChange: (month: Dayjs) => void;
}

/** The Duration dropdown, plus a month picker when "Custom Month" is chosen. */
export function DurationControls({
  duration,
  onDurationChange,
  customMonth,
  onCustomMonthChange,
}: DurationControlsProps) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', rowGap: 1 }}
    >
      <TextField
        select
        size="small"
        label="Duration"
        sx={{ width: 170 }}
        value={duration}
        onChange={(event) => onDurationChange(event.target.value as Duration)}
      >
        {DURATION_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      {duration === 'CUSTOM_MONTH' && (
        <DatePicker
          label="Month"
          views={['year', 'month']}
          openTo="month"
          format="MMM YYYY"
          value={customMonth}
          onChange={(value) => {
            if (value?.isValid()) onCustomMonthChange(value.startOf('month'));
          }}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
        />
      )}
    </Stack>
  );
}
