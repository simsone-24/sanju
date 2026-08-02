import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import { useState, type KeyboardEvent } from 'react';

interface DatePickerFieldProps {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  error?: boolean;
  helperText?: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  /** Matches MUI TextField's margin — default 'normal' fits stacked drawer forms; pass 'none'
   * inside a grid (FormSection) or a filter-bar row, where the container already spaces fields. */
  margin?: 'none' | 'dense' | 'normal';
}

// Thin wrapper so form pages can wire this up via RHF's Controller:
// <Controller name="eventDate" control={control} render={({ field }) => <DatePickerField {...field} label="Event Date" />} />
//
// md files/UI-2.md "Date Picker": the calendar must open on click anywhere in the input, on
// keyboard focus, or via the icon — not the icon alone.
//
// Deliberately NOT passing `readOnly` to <DatePicker>: that prop is threaded by MUI X into the
// popped-up DateCalendar as well (see DayCalendar's handleDaySelect, which no-ops entirely when
// readOnly), so it silently disabled clicking a day to select it — the calendar opened but
// nothing was selectable. Typing directly into the field's sections remains possible as a
// result, which is an acceptable secondary input method alongside the calendar.
//
// Deliberately NOT opening on plain `onFocus` either: MUI X's own PickerPopper restores focus to
// the trigger input after the popper closes (for accessibility — see its `lastFocusedElementRef`
// effect), and that restored focus re-fires `onFocus`, which reopened the calendar immediately —
// clicking anywhere outside looked like it did nothing. Opening on an explicit key press
// (Enter/Space/ArrowDown) instead of on focus itself keeps keyboard users able to open it while
// no longer fighting the library's own refocus-on-close behavior.
export function DatePickerField({
  label,
  value,
  onChange,
  error,
  helperText,
  minDate,
  maxDate,
  margin = 'normal',
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <DatePicker
      label={label}
      value={value}
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      slotProps={{
        textField: {
          fullWidth: true,
          size: 'small',
          margin,
          error,
          helperText,
          onClick: () => setOpen(true),
          onKeyDown: handleKeyDown,
        },
        field: { clearable: true, onClear: () => onChange(null) },
      }}
    />
  );
}
