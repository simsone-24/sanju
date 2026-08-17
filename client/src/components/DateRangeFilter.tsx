import { MenuItem, TextField, type SxProps, type Theme } from '@mui/material';
import {
  DATE_RANGE_LABELS,
  EVENT_DATE_PRESETS,
  type DateRangePreset,
} from '../utils/dateRange';
import { SelectField } from './ui/Select';

/**
 * Sentinel selection meaning "the page's own From/To pickers drive the range". It is not a preset:
 * choosing it computes no window of its own, it just hands the range back to the date fields.
 */
export const CUSTOM_DATE_RANGE = 'CUSTOM';

export type DateRangeValue = DateRangePreset | typeof CUSTOM_DATE_RANGE | '';

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  /** Windows this page offers, in dropdown order. Defaults to the forward-looking event windows. */
  presets?: readonly DateRangePreset[];
  label?: string;
  /** Label for the unset ("") option. */
  allLabel?: string;
  /** Offer "Custom Range" — only for pages that have their own From/To pickers to hand over to. */
  custom?: boolean;
  /**
   * Which toolbar idiom to match. `stacked` renders the Tailwind select whose label sits above the
   * box (Enquiries, Payment Tracker, Quotations); `floating` renders the MUI select with an inset
   * label, for the toolbars built from MUI fields (Orders, Stock Out, Rent Payments). Both are
   * 40px tall, so either bottom-aligns with the row it joins.
   */
  variant?: 'stacked' | 'floating';
  size?: 'sm' | 'md';
  className?: string;
  sx?: SxProps<Theme>;
}

/**
 * The single Date Range control shared by every index page: all named windows — day, week, month
 * and their neighbours — collapse into one dropdown in the filter row rather than a pill per range
 * spilling onto a line of its own.
 */
export function DateRangeFilter({
  value,
  onChange,
  presets = EVENT_DATE_PRESETS,
  label = 'Date Range',
  allLabel = 'All Dates',
  custom = false,
  variant = 'stacked',
  size = 'md',
  className = '',
  sx,
}: DateRangeFilterProps) {
  const options = presets.map((preset) => ({ value: preset as string, label: DATE_RANGE_LABELS[preset] }));
  if (custom) options.push({ value: CUSTOM_DATE_RANGE, label: 'Custom Range' });

  if (variant === 'floating') {
    return (
      <TextField
        select
        size="small"
        label={label}
        className={className}
        sx={sx}
        value={value}
        onChange={(event) => onChange(event.target.value as DateRangeValue)}
      >
        <MenuItem value="">{allLabel}</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return (
    <SelectField
      size={size}
      className={className}
      label={label}
      emptyLabel={allLabel}
      value={value}
      onChange={(next) => onChange(next as DateRangeValue)}
      options={options}
    />
  );
}
