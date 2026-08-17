import AddIcon from '@mui/icons-material/Add';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { CUSTOM_DATE_RANGE, DateRangeFilter, type DateRangeValue } from '../../components/DateRangeFilter';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as rentService from '../../services/rentService';
import type { RentPaymentStatus, StockOutSummary, StockReturnStatus } from '../../types/rent';
import { DATE_RANGE_LABELS, dateRangeParams, TRANSACTION_DATE_PRESETS } from '../../utils/dateRange';
import { formatCurrency, formatDate } from '../../utils/format';

// The row accent restates the return status for scanning: still fully out reads red, part-returned
// amber, settled has no accent at all — a finished transaction needs no attention.
const RETURN_ACCENT: Record<StockReturnStatus, string | undefined> = {
  NOT_RETURNED: '#EF4444',
  PARTIAL_RETURNED: '#F59E0B',
  RETURNED: undefined,
};

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

/** Stock Out index — "md files/Stock/stock.md" §11. */
export default function StockOutListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const canView = usePermission('RENT', 'canView');
  const canCreate = usePermission('RENT', 'canCreate');
  const canExport = usePermission('RENT', 'canExport');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  // Deep links from the dashboard cards land here with a filter already applied.
  const [returnStatus, setReturnStatus] = useState<StockReturnStatus | ''>(
    (searchParams.get('returnStatus') as StockReturnStatus) ?? '',
  );
  const [paymentStatus, setPaymentStatus] = useState<RentPaymentStatus | ''>(
    (searchParams.get('paymentStatus') as RentPaymentStatus) ?? '',
  );
  const [rentalPersonId, setRentalPersonId] = useState(searchParams.get('rentalPersonId') ?? '');
  const [dateRange, setDateRange] = useState<DateRangeValue>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // The Date Range dropdown and the From/To fields both resolve to one stock-out date window: a
  // named preset computes its own bounds (and shows them in the fields), while "Custom Range" —
  // like leaving the dropdown unset — defers to whatever the fields hold.
  const preset = dateRange && dateRange !== CUSTOM_DATE_RANGE ? dateRange : null;
  const presetBounds = preset ? dateRangeParams(preset) : null;
  const effectiveFrom = presetBounds ? presetBounds.from : dateFrom;
  const effectiveTo = presetBounds ? (presetBounds.to ?? '') : dateTo;

  const { data: persons } = useQuery({
    queryKey: ['rent-persons', 'picker'],
    queryFn: () => rentService.listPersons({ limit: 100 }),
    enabled: canView,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      'rent-stock-outs',
      {
        page,
        limit,
        search,
        returnStatus,
        paymentStatus,
        rentalPersonId,
        dateFrom: effectiveFrom,
        dateTo: effectiveTo,
      },
    ],
    queryFn: () =>
      rentService.listStockOuts({
        page,
        limit,
        search: search || undefined,
        returnStatus: returnStatus || undefined,
        paymentStatus: paymentStatus || undefined,
        rentalPersonId: rentalPersonId || undefined,
        dateFrom: effectiveFrom || undefined,
        dateTo: effectiveTo || undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  const activeFilters: { key: string; label: string; onClear: () => void }[] = [];
  if (search) activeFilters.push({ key: 'search', label: `Search: "${search}"`, onClear: () => setSearch('') });
  if (returnStatus) {
    activeFilters.push({
      key: 'returnStatus',
      label: `Return: ${RETURN_STATUS_OPTIONS.find((o) => o.value === returnStatus)?.label}`,
      onClear: () => setReturnStatus(''),
    });
  }
  if (paymentStatus) {
    activeFilters.push({
      key: 'paymentStatus',
      label: `Payment: ${PAYMENT_STATUS_OPTIONS.find((o) => o.value === paymentStatus)?.label}`,
      onClear: () => setPaymentStatus(''),
    });
  }
  if (rentalPersonId) {
    activeFilters.push({
      key: 'person',
      label: `Person: ${persons?.records.find((p) => p.id === rentalPersonId)?.name ?? 'Selected'}`,
      onClear: () => setRentalPersonId(''),
    });
  }
  if (preset) {
    activeFilters.push({ key: 'range', label: DATE_RANGE_LABELS[preset], onClear: () => setDateRange('') });
  } else {
    if (dateFrom) activeFilters.push({ key: 'from', label: `From: ${dateFrom}`, onClear: () => setDateFrom('') });
    if (dateTo) activeFilters.push({ key: 'to', label: `To: ${dateTo}`, onClear: () => setDateTo('') });
  }

  // Picking a named window discards any hand-typed From/To, so the range shown is always the one
  // the dropdown names.
  function applyDateRange(value: DateRangeValue) {
    setDateRange(value);
    if (value !== CUSTOM_DATE_RANGE) {
      setDateFrom('');
      setDateTo('');
    }
    setPage(1);
  }

  // Typing in either field is what "Custom Range" means. The bound the user did not touch is
  // carried over from what's on screen, so leaving a named window narrows the range rather than
  // half-clearing it.
  function applyCustomBound(patch: { from?: string; to?: string }) {
    setDateFrom(patch.from !== undefined ? patch.from : effectiveFrom);
    setDateTo(patch.to !== undefined ? patch.to : effectiveTo);
    setDateRange(CUSTOM_DATE_RANGE);
    setPage(1);
  }

  function resetFilters() {
    setSearch('');
    setReturnStatus('');
    setPaymentStatus('');
    setRentalPersonId('');
    setDateRange('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  const columns: DataTableColumn<StockOutSummary>[] = [
    {
      key: 'rentNo',
      header: 'Rent No',
      sortable: true,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
            {row.rentNo}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {formatDate(row.stockOutDate)}
          </Typography>
        </Stack>
      ),
      exportValue: (row) => row.rentNo,
    },
    {
      key: 'person',
      header: 'Rental Person',
      sortable: true,
      render: (row) => (
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {row.rentalPerson.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.rentalPerson.phone}
          </Typography>
        </Stack>
      ),
      exportValue: (row) => row.rentalPerson.name,
    },
    {
      key: 'expectedReturnDate',
      header: 'Expected Return',
      align: 'center',
      render: (row) => formatDate(row.expectedReturnDate),
      exportValue: (row) => (row.expectedReturnDate ? formatDate(row.expectedReturnDate) : ''),
    },
    {
      key: 'issuedQuantity',
      header: 'Items',
      align: 'center',
      width: 110,
      render: (row) => (
        <Tooltip title={`${row.totalItems} line(s), ${row.issuedQuantity} issued`}>
          <Chip size="small" label={row.issuedQuantity} sx={{ fontWeight: 700, bgcolor: 'action.selected' }} />
        </Tooltip>
      ),
      exportValue: (row) => String(row.issuedQuantity),
    },
    {
      key: 'grandTotal',
      header: 'Amount',
      align: 'right',
      render: (row) => formatCurrency(row.grandTotal),
      exportValue: (row) => String(row.grandTotal),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ color: row.paidAmount > 0 ? 'success.dark' : 'text.disabled' }}>
          {formatCurrency(row.paidAmount)}
        </Typography>
      ),
      exportValue: (row) => String(row.paidAmount),
    },
    {
      key: 'balanceAmount',
      header: 'Balance',
      align: 'right',
      render: (row) =>
        row.balanceAmount > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>
            {formatCurrency(row.balanceAmount)}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
            Settled
          </Typography>
        ),
      exportValue: (row) => String(row.balanceAmount),
    },
    {
      key: 'returnStatus',
      header: 'Return',
      align: 'center',
      width: 150,
      render: (row) => <StatusBadge type="rentReturn" status={row.returnStatus} size="sm" />,
      exportValue: (row) => row.returnStatus,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      align: 'center',
      width: 140,
      hideByDefault: true,
      render: (row) => <StatusBadge type="rentPayment" status={row.paymentStatus} size="sm" />,
      exportValue: (row) => row.paymentStatus,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: 80,
      render: (row) => (
        <Tooltip title="View stock out">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/rent/stock-outs/${row.id}`);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view stock outs.</Typography>;
  }

  return (
    <Box>
      <PageHeader
        title="Stock Out"
        subtitle={`${data?.meta.totalRecords ?? 0} total transactions`}
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Rent', to: '/rent' }, { label: 'Stock Out' }]}
        actions={
          canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/rent/stock-outs/new')}>
              New Stock Out
            </Button>
          )
        }
      />

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '16px' }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end', flexWrap: 'wrap', rowGap: 2 }}>
            <Box sx={{ flexGrow: 1, minWidth: 220, height: 40, display: 'flex', alignItems: 'center' }}>
              <SearchBar
                fullWidth
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Search by rent no, person, phone, item..."
              />
            </Box>

            <TextField
              select
              size="small"
              label="Rental Person"
              sx={{ width: 200 }}
              value={rentalPersonId}
              onChange={(event) => {
                setRentalPersonId(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {persons?.records.map((person) => (
                <MenuItem key={person.id} value={person.id}>
                  {person.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Return Status"
              sx={{ width: 180 }}
              value={returnStatus}
              onChange={(event) => {
                setReturnStatus(event.target.value as StockReturnStatus | '');
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {RETURN_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Payment Status"
              sx={{ width: 180 }}
              value={paymentStatus}
              onChange={(event) => {
                setPaymentStatus(event.target.value as RentPaymentStatus | '');
                setPage(1);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <DateRangeFilter
              variant="floating"
              presets={TRANSACTION_DATE_PRESETS}
              sx={{ width: 180 }}
              value={dateRange}
              onChange={applyDateRange}
              custom
            />

            <TextField
              type="date"
              size="small"
              label="From"
              sx={{ width: 160 }}
              value={effectiveFrom}
              onChange={(event) => applyCustomBound({ from: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              sx={{ width: 160 }}
              value={effectiveTo}
              onChange={(event) => applyCustomBound({ to: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Button
              variant="outlined"
              size="small"
              sx={{ height: 40 }}
              disabled={activeFilters.length === 0}
              onClick={resetFilters}
            >
              Reset
            </Button>
          </Stack>

          {activeFilters.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Active filters
              </Typography>
              {activeFilters.map((filter) => (
                <Chip key={filter.key} label={filter.label} size="small" onDelete={filter.onClear} />
              ))}
              <Button size="small" onClick={resetFilters}>
                Clear all
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      <DataTable
        columns={columns}
        rows={data?.records ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        meta={data?.meta}
        page={page}
        limit={limit}
        rowAccentColor={(row) => RETURN_ACCENT[row.returnStatus]}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onRowClick={(row) => navigate(`/rent/stock-outs/${row.id}`)}
        onRefresh={() => refetch()}
        refreshing={isFetching}
        emptyState={{
          icon: <Inventory2OutlinedIcon sx={{ fontSize: 36 }} />,
          title: 'No stock has gone out yet',
          description: 'Record what you hand to a rental person, and track its return and payment from here.',
          action:
            activeFilters.length > 0 ? (
              <Button onClick={resetFilters}>Reset Filters</Button>
            ) : canCreate ? (
              <Button variant="contained" onClick={() => navigate('/rent/stock-outs/new')}>
                New Stock Out
              </Button>
            ) : undefined,
        }}
        exportFileName="stock-outs"
        canExport={canExport}
      />
    </Box>
  );
}
