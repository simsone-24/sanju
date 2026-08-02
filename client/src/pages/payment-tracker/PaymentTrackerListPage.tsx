import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PaymentsIcon from '@mui/icons-material/Payments';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Autocomplete, Box, Button, Chip, IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DatePickerField } from '../../components/DatePickerField';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatCard } from '../../components/StatCard';
import { resolveStatusConfig } from '../../components/statusConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as customerService from '../../services/customerService';
import * as paymentTrackerService from '../../services/paymentTrackerService';
import type { CustomerOption } from '../../types/masters';
import type { OrderStatus } from '../../types/order';
import type {
  PaymentTrackerRecord,
  PaymentTrackerStatus,
  PaymentTrackerStatusGroup,
} from '../../types/paymentTracker';
import { eventProximity, formatCurrency, formatDate } from '../../utils/format';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import { PaymentTrackerEditDrawer } from './PaymentTrackerEditDrawer';

// Cancelled orders never reach this module (they carry no payment obligation), so they are not
// offered as a filter either.
const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'CONFIRMED',
  'ADVANCE_PENDING',
  'ADVANCE_RECEIVED',
  'PLANNING',
  'READY',
  'IN_PROGRESS',
  'COMPLETED',
  'BALANCE_PENDING',
  'CLOSED',
];

const PAYMENT_STATUS_OPTIONS: PaymentTrackerStatus[] = [
  'PENDING',
  'ADVANCE_PAID',
  'PARTIAL_PAYMENT',
  'FULLY_PAID',
];

// Row-left accent by payment standing — the column this module is scanned by. Literal values
// because DataTable's rowAccentColor callback runs outside a theme-aware sx function.
const PAYMENT_ROW_ACCENT: Record<PaymentTrackerStatus, string> = {
  PENDING: '#94A3B8',
  ADVANCE_PAID: '#EAB308',
  PARTIAL_PAYMENT: '#F59E0B',
  FULLY_PAID: '#22C55E',
};

// "payment/payment.md" §Filters — one-at-a-time quick ranges over the event date, alongside the
// custom From/To range below them.
type QuickRange = 'THIS_WEEK' | 'NEXT_WEEK' | 'THIS_MONTH' | 'NEXT_MONTH';

const QUICK_RANGES: { key: QuickRange; label: string }[] = [
  { key: 'THIS_WEEK', label: 'This Week' },
  { key: 'NEXT_WEEK', label: 'Next Week' },
  { key: 'THIS_MONTH', label: 'This Month' },
  { key: 'NEXT_MONTH', label: 'Next Month' },
];

function quickRangeDates(key: QuickRange): { from: Dayjs; to: Dayjs } {
  const today = dayjs();
  switch (key) {
    case 'THIS_WEEK':
      return { from: today.startOf('week'), to: today.endOf('week') };
    case 'NEXT_WEEK':
      return { from: today.add(1, 'week').startOf('week'), to: today.add(1, 'week').endOf('week') };
    case 'THIS_MONTH':
      return { from: today.startOf('month'), to: today.endOf('month') };
    case 'NEXT_MONTH':
      return { from: today.add(1, 'month').startOf('month'), to: today.add(1, 'month').endOf('month') };
  }
}

function trackerStatus(row: PaymentTrackerRecord): PaymentTrackerStatus {
  return row.paymentTracker?.paymentStatus ?? 'PENDING';
}

export default function PaymentTrackerListPage() {
  const navigate = useNavigate();
  const canView = usePermission('PAYMENTS', 'canView');
  const canExport = usePermission('PAYMENTS', 'canExport');
  const canEdit = usePermission('PAYMENTS', 'canEdit');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentTrackerStatus | ''>('');
  const [statusGroup, setStatusGroup] = useState<PaymentTrackerStatusGroup | ''>('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus | ''>('');
  const [quickRange, setQuickRange] = useState<QuickRange | null>(null);
  const [customFrom, setCustomFrom] = useState<Dayjs | null>(null);
  const [customTo, setCustomTo] = useState<Dayjs | null>(null);
  const [editRecord, setEditRecord] = useState<PaymentTrackerRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<PaymentTrackerRecord | null>(null);

  // The quick-range pills and the custom From/To both resolve to one event-date window; whichever
  // was set last wins, so they can never silently fight each other.
  const range = quickRange
    ? quickRangeDates(quickRange)
    : customFrom || customTo
      ? { from: customFrom, to: customTo }
      : null;

  const eventDateFrom = range?.from ? range.from.format('YYYY-MM-DD') : undefined;
  const eventDateTo = range?.to ? range.to.format('YYYY-MM-DD') : undefined;

  const { data: stats } = useQuery({
    queryKey: ['payment-tracker', 'stats'],
    queryFn: () => paymentTrackerService.getStats(),
    enabled: canView,
  });

  const { data: customerOptions } = useQuery({
    queryKey: ['customers', 'search', customerQuery],
    queryFn: () => customerService.search(customerQuery),
    enabled: customerQuery.trim().length > 0,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      'payment-tracker',
      'list',
      { page, limit, search, paymentStatus, statusGroup, orderStatus, customerId: customer?.id, eventDateFrom, eventDateTo },
    ],
    queryFn: () =>
      paymentTrackerService.list({
        page,
        limit,
        search: search || undefined,
        customerId: customer?.id,
        paymentStatus: paymentStatus || undefined,
        statusGroup: statusGroup || undefined,
        orderStatus: orderStatus || undefined,
        eventDateFrom,
        eventDateTo,
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  function toggleGroup(group: PaymentTrackerStatusGroup) {
    setStatusGroup((current) => (current === group ? '' : group));
    setPaymentStatus('');
    setPage(1);
  }

  function resetFilters() {
    setSearch('');
    setCustomer(null);
    setCustomerQuery('');
    setPaymentStatus('');
    setStatusGroup('');
    setOrderStatus('');
    setQuickRange(null);
    setCustomFrom(null);
    setCustomTo(null);
    setPage(1);
  }

  const columns: DataTableColumn<PaymentTrackerRecord>[] = [
    {
      key: 'orderNumber',
      header: 'Order No',
      sortable: true,
      width: 150,
      render: (row) => (
        <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {row.orderNumber}
        </Typography>
      ),
      exportValue: (row) => row.orderNumber,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {row.customer.customerName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {row.customer.mobile}
          </Typography>
        </Box>
      ),
      exportValue: (row) => row.customer.customerName,
    },
    {
      key: 'event',
      header: 'Event',
      render: (row) => row.enquiry?.eventName || row.enquiry?.eventType.eventName || '—',
      exportValue: (row) => row.enquiry?.eventName || row.enquiry?.eventType.eventName || '',
    },
    {
      key: 'eventDate',
      header: 'Event Date',
      render: (row) => {
        const proximity = eventProximity(row.eventDate);
        return (
          <Box>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {formatDate(row.eventDate)}
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block' }} color="text.secondary">
              {dayjs(row.eventDate).format('ddd')} ·{' '}
              <Box
                component="span"
                sx={{ fontWeight: proximity.urgent ? 700 : 400, color: proximity.urgent ? 'warning.main' : 'inherit' }}
              >
                {proximity.text}
              </Box>
            </Typography>
          </Box>
        );
      },
      exportValue: (row) => formatDate(row.eventDate),
    },
    {
      key: 'status',
      header: 'Order Status',
      align: 'center',
      render: (row) => <StatusBadge type="order" status={row.status} size="sm" />,
      exportValue: (row) => row.status,
    },
    {
      key: 'totalAmount',
      header: 'Budget',
      align: 'right',
      width: 120,
      render: (row) => formatCurrency(row.totalAmount),
      exportValue: (row) => row.totalAmount,
    },
    {
      key: 'paidAmount',
      header: 'Collected',
      align: 'right',
      width: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: Number(row.paidAmount) > 0 ? 'success.main' : 'inherit' }}>
          {formatCurrency(row.paidAmount)}
        </Typography>
      ),
      exportValue: (row) => row.paidAmount,
    },
    {
      key: 'pendingAmount',
      header: 'Balance',
      align: 'right',
      width: 120,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: Number(row.pendingAmount) > 0 ? 'warning.main' : 'text.secondary' }}>
          {formatCurrency(row.pendingAmount)}
        </Typography>
      ),
      exportValue: (row) => row.pendingAmount,
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      align: 'center',
      render: (row) => (
        <Box>
          <StatusBadge type="paymentTracker" status={trackerStatus(row)} size="sm" />
          {/* A pinned status no longer follows the payments, so the row says so rather than
              leaving a stale-looking badge unexplained. */}
          {row.paymentTracker?.statusManual && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              set manually
            </Typography>
          )}
        </Box>
      ),
      exportValue: (row) => trackerStatus(row),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'flex-end' }}>
          <Tooltip title="View payment details">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/payment-tracker/${row.id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Payment history">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setHistoryRecord(row);
              }}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Invoice">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/payment-tracker/${row.id}/invoice`);
              }}
            >
              <ReceiptIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Tooltip title="Edit payment">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditRecord(row);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Payment Tracker"
        subtitle="Budget, collections and outstanding balance for every confirmed order."
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Payment Tracker' }]}
      />

      {/* §Dashboard Cards. The four count cards double as filters; the three money totals are
          summaries of the whole book, with no row subset they could sensibly filter to. */}
      <div className="tw-mb-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={<PaymentsIcon />}
          tone="blue"
          onClick={() => {
            setStatusGroup('');
            setPaymentStatus('');
            setPage(1);
          }}
          selected={statusGroup === '' && paymentStatus === ''}
        />
        <StatCard
          label="Pending Payments"
          value={stats?.pendingPayments ?? 0}
          icon={<PendingActionsIcon />}
          tone="slate"
          onClick={() => toggleGroup('PENDING')}
          selected={statusGroup === 'PENDING'}
        />
        <StatCard
          label="Partial Payments"
          value={stats?.partialPayments ?? 0}
          icon={<HourglassEmptyIcon />}
          tone="amber"
          onClick={() => toggleGroup('PARTIAL')}
          selected={statusGroup === 'PARTIAL'}
        />
        <StatCard
          label="Fully Paid Orders"
          value={stats?.fullyPaidOrders ?? 0}
          icon={<CheckCircleIcon />}
          tone="green"
          onClick={() => toggleGroup('PAID')}
          selected={statusGroup === 'PAID'}
        />
      </div>

      <div className="tw-mb-6 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-3">
        <StatCard
          label="Total Budget"
          value={formatCurrency(stats?.totalBudget ?? 0)}
          icon={<SavingsIcon />}
          tone="cyan"
        />
        <StatCard
          label="Total Collected"
          value={formatCurrency(stats?.totalCollected ?? 0)}
          icon={<TrendingUpIcon />}
          tone="green"
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(stats?.outstandingBalance ?? 0)}
          icon={<AccountBalanceWalletIcon />}
          tone="orange"
        />
      </div>

      <Paper
        variant="outlined"
        sx={(t) => ({
          p: 2,
          mb: 3,
          borderRadius: '16px',
          boxShadow: '0 12px 32px -18px rgba(15, 23, 42, 0.12)',
          ...t.applyStyles('dark', { boxShadow: '0 12px 32px -18px rgba(0, 0, 0, 0.55)' }),
        })}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
            <Chip
              label="All Dates"
              size="small"
              color={quickRange === null && !customFrom && !customTo ? 'primary' : 'default'}
              variant={quickRange === null && !customFrom && !customTo ? 'filled' : 'outlined'}
              onClick={() => {
                setQuickRange(null);
                setCustomFrom(null);
                setCustomTo(null);
                setPage(1);
              }}
            />
            {QUICK_RANGES.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                size="small"
                color={quickRange === option.key ? 'primary' : 'default'}
                variant={quickRange === option.key ? 'filled' : 'outlined'}
                onClick={() => {
                  setQuickRange((current) => (current === option.key ? null : option.key));
                  setCustomFrom(null);
                  setCustomTo(null);
                  setPage(1);
                }}
              />
            ))}
          </Stack>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}>
            <Box sx={{ flexGrow: 1, minWidth: 220 }}>
              <SearchBar
                fullWidth
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Search by order no, customer, mobile..."
              />
            </Box>

            <Box sx={{ width: 220 }}>
              <Autocomplete
                size="small"
                options={customerOptions ?? []}
                value={customer}
                onChange={(_event, value) => {
                  setCustomer(value);
                  setPage(1);
                }}
                onInputChange={(_event, value) => setCustomerQuery(value)}
                getOptionLabel={(option) => `${option.customerName} (${option.mobile})`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={customerQuery ? 'No customers found' : 'Type to search'}
                renderInput={(params) => <TextField {...params} label="Customer" />}
              />
            </Box>

            <Box sx={{ width: 180 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Payment Status"
                value={paymentStatus}
                onChange={(event) => {
                  setPaymentStatus(event.target.value as PaymentTrackerStatus | '');
                  setStatusGroup('');
                  setPage(1);
                }}
              >
                <MenuItem value="">All Payments</MenuItem>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {resolveStatusConfig('paymentTracker', option).label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ width: 175 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Order Status"
                value={orderStatus}
                onChange={(event) => {
                  setOrderStatus(event.target.value as OrderStatus | '');
                  setPage(1);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {resolveStatusConfig('order', option).label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Stack>

          {/* §Filters "Custom Date Range" — sets the same event-date window the pills above do. */}
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}>
            <Box sx={{ width: 180 }}>
              <DatePickerField
                label="Event Date From"
                margin="none"
                value={customFrom}
                onChange={(value) => {
                  setCustomFrom(value);
                  setQuickRange(null);
                  setPage(1);
                }}
              />
            </Box>
            <Box sx={{ width: 180 }}>
              <DatePickerField
                label="Event Date To"
                margin="none"
                minDate={customFrom ?? undefined}
                value={customTo}
                onChange={(value) => {
                  setCustomTo(value);
                  setQuickRange(null);
                  setPage(1);
                }}
              />
            </Box>
            <Button variant="outlined" size="small" sx={{ height: 40 }} onClick={resetFilters}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {canView ? (
        <DataTable
          columns={columns}
          rows={data?.records ?? []}
          getRowId={(row) => row.id}
          loading={isLoading}
          meta={data?.meta}
          page={page}
          limit={limit}
          rowAccentColor={(row) => PAYMENT_ROW_ACCENT[trackerStatus(row)]}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          onRowClick={(row) => navigate(`/payment-tracker/${row.id}`)}
          onRefresh={() => void refetch()}
          refreshing={isFetching}
          emptyState={{
            icon: <PaymentsIcon sx={{ fontSize: 36 }} />,
            title: 'No Payment Records Found',
            description: 'Records appear here automatically once an enquiry is confirmed as an order.',
            action: <Button onClick={resetFilters}>Reset Filters</Button>,
          }}
          exportFileName="payment-tracker"
          canExport={canExport}
        />
      ) : (
        <Typography color="text.secondary">You do not have access to view payments.</Typography>
      )}

      <PaymentTrackerEditDrawer
        open={editRecord !== null}
        record={editRecord}
        onClose={() => setEditRecord(null)}
      />

      <PaymentHistoryDialog
        open={historyRecord !== null}
        record={historyRecord}
        onClose={() => setHistoryRecord(null)}
      />
    </Box>
  );
}
