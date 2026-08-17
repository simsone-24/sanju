import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { CUSTOM_DATE_RANGE, DateRangeFilter, type DateRangeValue } from '../../components/DateRangeFilter';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatCard } from '../../components/StatCard';
import { usePermission } from '../../hooks/usePermission';
import * as rentService from '../../services/rentService';
import { useToast } from '../../store/ToastContext';
import { RENT_PAYMENT_MODES, type RentPayment, type RentPaymentMode } from '../../types/rent';
import { describeApiError } from '../../utils/apiError';
import { dateRangeParams, TRANSACTION_DATE_PRESETS } from '../../utils/dateRange';
import { formatCurrency, formatDate } from '../../utils/format';
import { RentPaymentDialog } from './RentPaymentDialog';

/** Rent Payments — "md files/Stock/stock.md" §20, §21. */
export default function RentPaymentListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const canView = usePermission('RENT', 'canView');
  const canCreate = usePermission('RENT', 'canCreate');
  const canDelete = usePermission('RENT', 'canDelete');
  const canExport = usePermission('RENT', 'canExport');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [rentalPersonId, setRentalPersonId] = useState('');
  const [paymentMode, setPaymentMode] = useState<RentPaymentMode | ''>('');
  const [dateRange, setDateRange] = useState<DateRangeValue>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // The Date Range dropdown and the From/To fields both resolve to one payment-date window: a
  // named preset computes its own bounds (and shows them in the fields), while "Custom Range" —
  // like leaving the dropdown unset — defers to whatever the fields hold.
  const preset = dateRange && dateRange !== CUSTOM_DATE_RANGE ? dateRange : null;
  const presetBounds = preset ? dateRangeParams(preset) : null;
  const effectiveFrom = presetBounds ? presetBounds.from : dateFrom;
  const effectiveTo = presetBounds ? (presetBounds.to ?? '') : dateTo;

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

  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<RentPayment | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['rent-payment-summary'],
    queryFn: () => rentService.getPaymentSummary(),
    enabled: canView,
  });

  const { data: persons } = useQuery({
    queryKey: ['rent-persons', 'picker'],
    queryFn: () => rentService.listPersons({ limit: 100 }),
    enabled: canView,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      'rent-payments',
      { page, limit, search, rentalPersonId, paymentMode, dateFrom: effectiveFrom, dateTo: effectiveTo },
    ],
    queryFn: () =>
      rentService.listPayments({
        page,
        limit,
        search: search || undefined,
        rentalPersonId: rentalPersonId || undefined,
        paymentMode: paymentMode || undefined,
        dateFrom: effectiveFrom || undefined,
        dateTo: effectiveTo || undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  const deleteMutation = useMutation({
    mutationFn: (paymentId: string) => rentService.deletePayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rent-payments'] });
      queryClient.invalidateQueries({ queryKey: ['rent-payment-summary'] });
      queryClient.invalidateQueries({ queryKey: ['rent-stock-outs'] });
      queryClient.invalidateQueries({ queryKey: ['rent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rent-persons'] });
      showToast('Payment deleted.');
      setDeleting(null);
    },
    onError: (error) => setActionError(describeApiError(error, 'Unable to delete the payment.')),
  });

  const columns: DataTableColumn<RentPayment>[] = [
    {
      key: 'paymentNo',
      header: 'Payment No',
      sortable: true,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
          {row.paymentNo}
        </Typography>
      ),
      exportValue: (row) => row.paymentNo,
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
      key: 'rentNo',
      header: 'Stock Out',
      render: (row) => row.stockOut.rentNo,
      exportValue: (row) => row.stockOut.rentNo,
    },
    {
      key: 'paymentDate',
      header: 'Date',
      align: 'center',
      render: (row) => formatDate(row.paymentDate),
      exportValue: (row) => formatDate(row.paymentDate),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.dark' }}>
          {formatCurrency(row.amount)}
        </Typography>
      ),
      exportValue: (row) => String(row.amount),
    },
    {
      key: 'paymentMode',
      header: 'Mode',
      align: 'center',
      render: (row) => row.paymentMode.replace('_', ' '),
      exportValue: (row) => row.paymentMode,
    },
    {
      key: 'referenceNo',
      header: 'Reference',
      render: (row) => row.referenceNo ?? '—',
      exportValue: (row) => row.referenceNo ?? '',
    },
    {
      key: 'notes',
      header: 'Notes',
      hideByDefault: true,
      render: (row) => row.notes ?? '—',
      exportValue: (row) => row.notes ?? '',
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: 80,
      render: (row) =>
        canDelete ? (
          <Tooltip title="Delete payment">
            <IconButton
              size="small"
              color="error"
              onClick={(event) => {
                event.stopPropagation();
                setActionError(null);
                setDeleting(row);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null,
    },
  ];

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view rent payments.</Typography>;
  }

  return (
    <Box>
      <PageHeader
        title="Rent Payments"
        subtitle={`${data?.meta.totalRecords ?? 0} collections recorded`}
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Rent', to: '/rent' }, { label: 'Payments' }]}
        actions={
          canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
              Add Payment
            </Button>
          )
        }
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          mb: 3,
        }}
      >
        <StatCard
          label="Total Rental Amount"
          value={formatCurrency(summary?.totalRentalAmount ?? 0)}
          icon={<ReceiptLongIcon />}
          tone="blue"
          loading={loadingSummary}
        />
        <StatCard
          label="Total Received"
          value={formatCurrency(summary?.totalReceived ?? 0)}
          icon={<PaidOutlinedIcon />}
          tone="green"
          subtext={`${summary?.paidCount ?? 0} settled transaction(s)`}
          loading={loadingSummary}
        />
        <StatCard
          label="Total Pending"
          value={formatCurrency(summary?.totalPending ?? 0)}
          icon={<AccountBalanceWalletIcon />}
          tone="amber"
          subtext={`${(summary?.unpaidCount ?? 0) + (summary?.partiallyPaidCount ?? 0)} unsettled`}
          loading={loadingSummary}
        />
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '16px' }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: 220, height: 40, display: 'flex', alignItems: 'center' }}>
            <SearchBar
              fullWidth
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by payment no, rent no, person, reference..."
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
            label="Mode"
            sx={{ width: 170 }}
            value={paymentMode}
            onChange={(event) => {
              setPaymentMode(event.target.value as RentPaymentMode | '');
              setPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {RENT_PAYMENT_MODES.map((mode) => (
              <MenuItem key={mode.value} value={mode.value}>
                {mode.label}
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
        </Stack>
      </Paper>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <DataTable
        columns={columns}
        rows={data?.records ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        meta={data?.meta}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onRowClick={(row) => navigate(`/rent/stock-outs/${row.stockOut.id}`)}
        onRefresh={() => refetch()}
        refreshing={isFetching}
        emptyState={{
          icon: <PaymentsIcon sx={{ fontSize: 36 }} />,
          title: 'No payments yet',
          description: 'Collections against rent transactions are recorded here.',
          action: canCreate ? (
            <Button variant="contained" onClick={() => setAddOpen(true)}>
              Add Payment
            </Button>
          ) : undefined,
        }}
        exportFileName="rent-payments"
        canExport={canExport}
      />

      <RentPaymentDialog open={addOpen} onClose={() => setAddOpen(false)} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Payment?"
        message={`Delete ${deleting?.paymentNo} of ${formatCurrency(deleting?.amount ?? 0)}? The stock out's balance will reopen by that amount.`}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
