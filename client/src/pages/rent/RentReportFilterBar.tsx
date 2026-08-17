import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { SearchBar } from '../../components/SearchBar';
import * as rentService from '../../services/rentService';
import {
  RENT_PAYMENT_MODES,
  type RentPaymentMode,
  type RentPaymentStatus,
  type RentReportFilters,
  type StockReturnStatus,
} from '../../types/rent';

/** Which controls a report offers — "md files/Stock/stock.md" §27 lists a different set per report. */
export interface RentReportFilterConfig {
  dateRange?: boolean;
  person?: boolean;
  item?: boolean;
  returnStatus?: boolean;
  paymentMode?: boolean;
  paymentStatus?: boolean;
  search?: boolean;
  searchPlaceholder?: string;
}

interface RentReportFilterBarProps {
  config: RentReportFilterConfig;
  filters: RentReportFilters;
  onChange: (filters: RentReportFilters) => void;
}

const RETURN_STATUS_OPTIONS: { value: StockReturnStatus; label: string }[] = [
  { value: 'NOT_RETURNED', label: 'Not Returned' },
  { value: 'PARTIAL_RETURNED', label: 'Partial Returned' },
  { value: 'RETURNED', label: 'Returned' },
];

const PAYMENT_STATUS_OPTIONS: { value: RentPaymentStatus; label: string }[] = [
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'PAID', label: 'Paid' },
];

/** The filter row shared by all five rent reports, showing only the controls its report offers. */
export function RentReportFilterBar({ config, filters, onChange }: RentReportFilterBarProps) {
  const { data: persons } = useQuery({
    queryKey: ['rent-persons', 'picker'],
    queryFn: () => rentService.listPersons({ limit: 100 }),
    enabled: Boolean(config.person),
  });

  const { data: items } = useQuery({
    queryKey: ['rent-items', 'picker'],
    queryFn: () => rentService.listItems({ limit: 100 }),
    enabled: Boolean(config.item),
  });

  function set<K extends keyof RentReportFilters>(key: K, value: RentReportFilters[K]) {
    onChange({ ...filters, [key]: value || undefined });
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: '16px' }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}>
        {config.search && (
          <Box sx={{ flexGrow: 1, minWidth: 220, height: 40, display: 'flex', alignItems: 'center' }}>
            <SearchBar
              fullWidth
              value={filters.search ?? ''}
              onChange={(value) => set('search', value)}
              placeholder={config.searchPlaceholder ?? 'Search…'}
            />
          </Box>
        )}

        {config.dateRange && (
          <>
            <TextField
              type="date"
              size="small"
              label="From"
              sx={{ width: 160 }}
              value={filters.dateFrom ?? ''}
              onChange={(event) => set('dateFrom', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              sx={{ width: 160 }}
              value={filters.dateTo ?? ''}
              onChange={(event) => set('dateTo', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </>
        )}

        {config.person && (
          <TextField
            select
            size="small"
            label="Rental Person"
            sx={{ width: 200 }}
            value={filters.rentalPersonId ?? ''}
            onChange={(event) => set('rentalPersonId', event.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {persons?.records.map((person) => (
              <MenuItem key={person.id} value={person.id}>
                {person.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        {config.item && (
          <TextField
            select
            size="small"
            label="Item"
            sx={{ width: 200 }}
            value={filters.rentalItemId ?? ''}
            onChange={(event) => set('rentalItemId', event.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {items?.records.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.itemName}
              </MenuItem>
            ))}
          </TextField>
        )}

        {config.returnStatus && (
          <TextField
            select
            size="small"
            label="Return Status"
            sx={{ width: 180 }}
            value={filters.returnStatus ?? ''}
            onChange={(event) => set('returnStatus', event.target.value as StockReturnStatus)}
          >
            <MenuItem value="">All</MenuItem>
            {RETURN_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        {config.paymentMode && (
          <TextField
            select
            size="small"
            label="Payment Mode"
            sx={{ width: 170 }}
            value={filters.paymentMode ?? ''}
            onChange={(event) => set('paymentMode', event.target.value as RentPaymentMode)}
          >
            <MenuItem value="">All</MenuItem>
            {RENT_PAYMENT_MODES.map((mode) => (
              <MenuItem key={mode.value} value={mode.value}>
                {mode.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        {config.paymentStatus && (
          <TextField
            select
            size="small"
            label="Payment Status"
            sx={{ width: 180 }}
            value={filters.paymentStatus ?? ''}
            onChange={(event) => set('paymentStatus', event.target.value as RentPaymentStatus)}
          >
            <MenuItem value="">All</MenuItem>
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}

        <Button variant="outlined" size="small" sx={{ height: 40 }} disabled={!hasFilters} onClick={() => onChange({})}>
          Reset
        </Button>
      </Stack>
    </Paper>
  );
}

/** The "showing the first N of more" notice every report shows when its row cap was reached. */
export function ReportTruncationNotice({ truncated, rowLimit }: { truncated: boolean; rowLimit: number }) {
  if (!truncated) return null;
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      Showing the first {rowLimit.toLocaleString('en-IN')} rows. Narrow the date range or add a filter to see the
      rest.
    </Alert>
  );
}

/** The totals strip under a report table. */
export function ReportTotals({ entries }: { entries: { label: string; value: string }[] }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '16px', p: 2, mt: 2 }}>
      <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
        {entries.map((entry) => (
          <Box key={entry.label}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {entry.label}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
