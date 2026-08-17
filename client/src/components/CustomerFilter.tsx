import { Autocomplete, TextField, type SxProps, type Theme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import * as customerService from '../services/customerService';
import type { CustomerOption } from '../types/masters';

interface CustomerFilterProps {
  value: CustomerOption | null;
  onChange: (customer: CustomerOption | null) => void;
  label?: string;
  /** Set false where the viewer may not read the customer master; the query then never runs. */
  enabled?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
}

/**
 * The customer type-ahead shared by every index page that filters by customer (Enquiries, Orders,
 * Payment Tracker). The customer master runs past what any dropdown could list, so the name is
 * typed and matched server-side rather than selected from a fetched page of options.
 *
 * It owns the query text it searches on, so callers hold only the chosen customer.
 */
export function CustomerFilter({
  value,
  onChange,
  label = 'Customer',
  enabled = true,
  className,
  sx,
}: CustomerFilterProps) {
  const [query, setQuery] = useState('');

  // A blank query still returns a first page (customerService.search), so the list opens populated
  // instead of making the user guess that typing is what fills it.
  const { data: options } = useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: () => customerService.search(query),
    enabled,
  });

  return (
    <Autocomplete
      size="small"
      className={className}
      sx={sx}
      options={options ?? []}
      value={value}
      onChange={(_event, next) => onChange(next)}
      onInputChange={(_event, next) => setQuery(next)}
      getOptionLabel={(option) => option.customerName}
      // The server has already matched the query (against mobile as well as name), so the options
      // are passed through as-is — MUI's own label-substring filter would otherwise discard every
      // row whose match was on a field the label omits.
      filterOptions={(current) => current}
      isOptionEqualToValue={(option, next) => option.id === next.id}
      noOptionsText="No customers found"
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}
