import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import type { Dayjs } from 'dayjs';
import { useState, type KeyboardEvent } from 'react';

interface TimePickerFieldProps {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
  error?: boolean;
  helperText?: string;
  /** Matches MUI TextField's margin — default 'normal' fits stacked drawer forms; pass 'none'
   * inside a grid (FormSection) or a filter-bar row, where the container already spaces fields. */
  margin?: 'none' | 'dense' | 'normal';
}

// md files/UI-2.md "Time Picker": opens on click anywhere in the input, on keyboard focus, or via
// the clock icon — not the icon alone.
//
// Deliberately NOT passing `readOnly` to <TimePicker>: see DatePickerField's comment — it
// disables selecting a time in the popped-up clock/list too, not just typing in the field.
//
// Deliberately NOT opening on plain `onFocus` either: see DatePickerField's comment — MUI X
// refocuses the trigger input after the popup closes, which re-fired `onFocus` and reopened it
// immediately, so clicking outside looked like it did nothing.
export function TimePickerField({ label, value, onChange, error, helperText, margin = 'normal' }: TimePickerFieldProps) {
  const [open, setOpen] = useState(false);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <TimePicker
      label={label}
      value={value}
      onChange={onChange}
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
