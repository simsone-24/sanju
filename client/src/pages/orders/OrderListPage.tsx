import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import EditIcon from '@mui/icons-material/Edit';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventIcon from '@mui/icons-material/Event';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PaymentsIcon from '@mui/icons-material/Payments';
import TodayIcon from '@mui/icons-material/Today';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Button,
  Chip,
  IconButton,
  ListSubheader,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CustomerFilter } from '../../components/CustomerFilter';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DateRangeFilter, type DateRangeValue } from '../../components/DateRangeFilter';
import { StatCard } from '../../components/StatCard';
import {
  resolveOrderPaymentBadge,
  resolveStatusConfig,
  type StatusBadgeType,
} from '../../components/statusConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as orderService from '../../services/orderService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type { CustomerOption } from '../../types/masters';
import type { OrderListItem, OrderStatus } from '../../types/order';
// Rows are ordered by event date (soonest first, server-side), so the date cell carries the
// scanning weight: weekday for planning, plus how near the event is (eventProximity).
import { DATE_RANGE_LABELS, dateRangeBounds, type DateRangePreset } from '../../utils/dateRange';
import { eventProximity, formatCurrency, formatDate } from '../../utils/format';
import { allowedOrderTransitions } from './orderStatusTransitions';

// Event/work lifecycle only — payment standing is a separate derived column.
const STATUS_OPTIONS: OrderStatus[] = ['YET_TO_START', 'IN_PROGRESS', 'ORDER_CLOSED', 'REJECTED'];

// The same scale the Payment column now shows (resolveOrderPaymentBadge): the tracker's four
// stored states, plus Overdue, which only the derived side can say. Kept as {type, status} pairs so
// each option renders and matches through exactly the same config the badge uses.
const PAYMENT_FILTER_OPTIONS: { type: StatusBadgeType; status: string }[] = [
  { type: 'paymentTracker', status: 'PENDING' },
  { type: 'paymentTracker', status: 'ADVANCE_PAID' },
  { type: 'paymentTracker', status: 'PARTIAL_PAYMENT' },
  { type: 'paymentTracker', status: 'FULLY_PAID' },
  { type: 'payment', status: 'OVERDUE' },
];

// Row-left accent per order status, mirroring statusConfig.ts's semantic grouping as literal
// values (DataTable's rowAccentColor callback runs outside a theme-aware sx function).
const ORDER_ROW_ACCENT: Record<OrderStatus, string> = {
  YET_TO_START: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  ORDER_CLOSED: '#10B981',
  REJECTED: '#EF4444',
};

// "md files/order/filter.md" §Date Filter — one-at-a-time named ranges over the event date, all
// offered from the toolbar's single Date Range dropdown (the shared forward-looking set).
export default function OrderListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canView = usePermission('ORDERS', 'canView');
  const canExport = usePermission('ORDERS', 'canExport');
  // Cancel Order and Complete Event are their own permissions (masters/user.md §Orders), so the
  // inline status menu is built from what this user may actually do.
  const canEdit = usePermission('ORDERS', 'canEdit');
  const statusPermissions = {
    canEdit,
    canCancel: usePermission('ORDERS', 'canCancel'),
    canCompleteEvent: usePermission('ORDERS', 'canCompleteEvent'),
  };
  const canViewPayments = usePermission('PAYMENTS', 'canView');

  const [statusMenu, setStatusMenu] = useState<{ anchor: HTMLElement; row: OrderListItem } | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  // One of PAYMENT_FILTER_OPTIONS' status values, or '' for all — it spans two status scales, so
  // it is held as the raw value both configs are keyed by.
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [quickRange, setQuickRange] = useState<DateRangePreset | null>(null);
  const [month, setMonth] = useState<Dayjs | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ row: OrderListItem; target: OrderStatus } | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // The Date Range dropdown and the month picker both resolve to one event-date window; whichever
  // was set last wins, so they can't silently fight each other.
  const range = quickRange
    ? dateRangeBounds(quickRange)
    : month
      ? { from: month.startOf('month'), to: month.endOf('month') }
      : null;

  const eventDateFrom = range ? range.from.format('YYYY-MM-DD') : undefined;
  const eventDateTo = range?.to ? range.to.format('YYYY-MM-DD') : undefined;

  // Narrows along with every active filter except `status` — each card defines its own status,
  // so folding the currently-selected card's status back into its own count would be circular
  // and would silently zero out the other cards whenever one was active.
  const { data: stats } = useQuery({
    queryKey: [
      'orders',
      'stats',
      {
        customerId: customer?.id,
        from: eventDateFrom,
        to: eventDateTo,
      },
    ],
    queryFn: () =>
      orderService.getStats({
        customerId: customer?.id,
        eventDateFrom,
        eventDateTo,
      }),
    enabled: canView,
    placeholderData: keepPreviousData,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'orders',
      {
        page,
        limit,
        status,
        customerId: customer?.id,
        from: eventDateFrom,
        to: eventDateTo,
      },
    ],
    queryFn: () =>
      orderService.list({
        page,
        limit,
        status: status || undefined,
        customerId: customer?.id,
        eventDateFrom,
        eventDateTo,
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: number; status: OrderStatus; cancellationReason?: string }) =>
      orderService.changeStatus(input.id, { status: input.status, cancellationReason: input.cancellationReason }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      showToast(`Order "${order.orderNumber}" moved to ${resolveStatusConfig('order', order.status).label}.`, 'success');
    },
  });

  async function handleConfirmStatus() {
    if (!pendingStatus) return;
    setStatusError(null);
    try {
      await statusMutation.mutateAsync({
        id: pendingStatus.row.id,
        status: pendingStatus.target,
        // The server requires a reason when rejecting; inline editing has no free-text field, so
        // a fixed one is sent and the detail page remains the place to record a fuller reason.
        cancellationReason: pendingStatus.target === 'REJECTED' ? 'Rejected from the Orders list.' : undefined,
      });
      setPendingStatus(null);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) setStatusError(error.response.data.message);
      else setStatusError('Unable to update the order status.');
    }
  }

  function resetFilters() {
    setStatus('');
    setPaymentStatus('');
    setCustomer(null);
    setQuickRange(null);
    setMonth(null);
    setPage(1);
  }

  // Payment standing mixes a stored status with a derived Overdue, so it can't be a server-side
  // `where` clause — it's filtered on the current page after fetching, against the same badge the
  // Payment column renders.
  const rows = (data?.records ?? []).filter(
    (row) => !paymentStatus || resolveOrderPaymentBadge(row).status === paymentStatus,
  );

  function toggleStatus(value: OrderStatus) {
    setStatus((current) => (current === value ? '' : value));
    setPage(1);
  }

  // Clicking the already-active event-date dashboard card clears its window back to "All Dates",
  // so a card doubles as its own toggle.
  function toggleQuickRange(value: DateRangePreset) {
    setQuickRange((current) => (current === value ? null : value));
    setMonth(null);
    setPage(1);
  }

  // A named window replaces the month picker, so the two can't disagree.
  function applyDateRange(value: DateRangeValue) {
    setQuickRange(value ? (value as DateRangePreset) : null);
    setMonth(null);
    setPage(1);
  }

  const activeFilters: { key: string; label: string; onClear: () => void }[] = [];
  if (customer) {
    activeFilters.push({
      key: 'customer',
      label: `Customer: ${customer.customerName}`,
      onClear: () => {
        setCustomer(null);
      },
    });
  }
  if (quickRange) {
    activeFilters.push({
      key: 'quickRange',
      label: DATE_RANGE_LABELS[quickRange],
      onClear: () => setQuickRange(null),
    });
  } else if (month) {
    activeFilters.push({ key: 'month', label: `Month: ${month.format('MMM YYYY')}`, onClear: () => setMonth(null) });
  }
  if (status) {
    activeFilters.push({
      key: 'status',
      label: `Status: ${resolveStatusConfig('order', status).label}`,
      onClear: () => setStatus(''),
    });
  }
  if (paymentStatus) {
    const option = PAYMENT_FILTER_OPTIONS.find((item) => item.status === paymentStatus);
    activeFilters.push({
      key: 'payment',
      label: `Payment: ${option ? resolveStatusConfig(option.type, option.status).label : paymentStatus}`,
      onClear: () => setPaymentStatus(''),
    });
  }

  const columns: DataTableColumn<OrderListItem>[] = [
    {
      key: 'orderNumber',
      header: 'Order No',
      sortable: true,
      align: 'center',
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
      align: 'center',
      render: (row) => row.customer.customerName,
      exportValue: (row) => row.customer.customerName,
    },
    {
      key: 'event',
      header: 'Event',
      align: 'center',
      render: (row) => row.enquiry?.eventName || row.enquiry?.eventType.eventName || '—',
      exportValue: (row) => row.enquiry?.eventName || row.enquiry?.eventType.eventName || '',
    },
    {
      key: 'eventDate',
      header: 'Event Date',
      align: 'center',
      render: (row) => {
        // An order confirmed before its event date was known: there is no day of the week or
        // countdown to show, only the fact that the date is still owed.
        if (!row.eventDate) {
          return (
            <Typography variant="body2" noWrap color="text.secondary">
              Not scheduled
            </Typography>
          );
        }
        const proximity = eventProximity(row.eventDate);
        return (
          <Box>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {formatDate(row.eventDate)}
            </Typography>
            <Typography variant="caption" noWrap sx={{ display: 'block' }} color="text.secondary">
              {dayjs(row.eventDate).format('ddd')}
              {row.enquiry?.eventTime ? ` · ${row.enquiry.eventTime === 'MORNING' ? 'Morning' : 'Evening'}` : ''} ·{' '}
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
      exportValue: (row) =>
        formatDate(row.eventDate) + (row.eventDate && row.enquiry?.eventTime ? ` (${row.enquiry.eventTime === 'MORNING' ? 'Morning' : 'Evening'})` : ''),
    },
    {
      key: 'venue',
      header: 'Venue',
      align: 'center',
      // Hidden by default to keep the 11-column table inside the viewport — re-enable any time
      // from the column picker in the table toolbar.
      hideByDefault: true,
      render: (row) => row.venue ?? '—',
      exportValue: (row) => row.venue ?? '',
    },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'center',
      width: 110,
      render: (row) => formatCurrency(row.totalAmount),
      exportValue: (row) => row.totalAmount,
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'center',
      width: 100,
      render: (row) => formatCurrency(row.paidAmount),
      exportValue: (row) => row.paidAmount,
    },
    {
      key: 'pendingAmount',
      header: 'Balance',
      align: 'center',
      width: 110,
      render: (row) => formatCurrency(row.pendingAmount),
      exportValue: (row) => row.pendingAmount,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      align: 'center',
      // The Payment Tracker's own status, so an order showing "Advance Paid" there does not read
      // "Partial" here (resolveOrderPaymentBadge). Read-only: payments are recorded through the
      // Payments tab and the tracker, and this badge just reflects where that left the order.
      render: (row) => (
        <Box>
          <StatusBadge {...resolveOrderPaymentBadge(row)} size="sm" />
          {Number(row.pendingAmount) > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {formatCurrency(row.pendingAmount)} due
            </Typography>
          )}
        </Box>
      ),
      exportValue: (row) => {
        const badge = resolveOrderPaymentBadge(row);
        return resolveStatusConfig(badge.type, badge.status).label;
      },
    },
    {
      key: 'status',
      header: 'Order Status',
      align: 'center',
      width: 150,
      // Inline status editing ("md files/order/filter.md" §Inline Status Editing). Tracks the
      // EVENT/work lifecycle only — payment standing is the separate derived column above, tracked
      // in the Payment Tracker module rather than gating this. The badge itself is the trigger, so
      // an editable cell reads exactly like a read-only one (no form control breaking the row
      // rhythm) and only reveals the menu affordance. The menu offers every other status
      // (allowedOrderTransitions), filtered only by permission — not by the order's current status.
      render: (row) => {
        const nextOptions = allowedOrderTransitions(row.status, statusPermissions);
        if (nextOptions.length === 0) return <StatusBadge type="order" status={row.status} size="sm" />;
        return (
          <Tooltip title="Change status">
            <Box
              component="button"
              type="button"
              aria-label={`Change status of order ${row.orderNumber}`}
              onClick={(event) => {
                event.stopPropagation();
                setStatusError(null);
                setStatusMenu({ anchor: event.currentTarget, row });
              }}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.25,
                maxWidth: '100%',
                px: 0.5,
                py: 0.25,
                border: 0,
                borderRadius: 999,
                bgcolor: 'transparent',
                font: 'inherit',
                cursor: 'pointer',
                transition: 'background-color 120ms ease',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <StatusBadge type="order" status={row.status} size="sm" />
              <KeyboardArrowDownIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
            </Box>
          </Tooltip>
        );
      },
      exportValue: (row) => row.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'center' }}>
          <Tooltip title="View order">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/orders/${row.id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Tooltip title="Edit order">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  // `?edit=1` opens the detail page straight into its edit drawer — the same
                  // deep-link mechanism the Payments action uses for `?tab=`. Without it this
                  // action landed on the read-only view, identical to the View button beside it.
                  navigate(`/orders/${row.id}?edit=1`);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canViewPayments && (
            <Tooltip title="Payments">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/orders/${row.id}?tab=payments`);
                }}
              >
                <PaymentsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      {/* Premium hero header — a soft brand wash and a decorative ring make the page open like a
          dashboard, and the record-count pill keeps the running total right beside the title. */}
      <section className="tw-relative tw-mb-4 tw-overflow-hidden tw-rounded-card tw-border tw-border-hairline tw-bg-white tw-px-4 tw-py-4 tw-shadow-card dark:tw-border-hairline-dark dark:tw-bg-surface-dark sm:tw-px-5">
        <div
          aria-hidden
          className="tw-pointer-events-none tw-absolute -tw-right-20 -tw-top-24 tw-h-60 tw-w-60 tw-rounded-full tw-bg-gradient-to-br tw-from-brand/15 tw-to-cyan-400/10 tw-blur-2xl"
        />
        <div
          aria-hidden
          className="tw-pointer-events-none tw-absolute -tw-bottom-24 tw-right-48 tw-h-44 tw-w-44 tw-rounded-[2rem] tw-border tw-border-brand/10"
        />

        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Orders' }]} />

        <div className="tw-relative tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-3">
          <div className="tw-min-w-0">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1.5">
              <h1 className="tw-m-0 tw-text-[1.75rem] tw-font-extrabold tw-leading-tight tw-tracking-tight tw-text-ink dark:tw-text-ink-dark">
                Orders
              </h1>
              {data?.meta?.totalRecords !== undefined && (
                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-brand/20 tw-bg-brand/10 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-tabular-nums tw-text-brand dark:tw-border-brand-light/30 dark:tw-bg-brand-light/15 dark:tw-text-brand-light">
                  {data.meta.totalRecords} {data.meta.totalRecords === 1 ? 'record' : 'records'}
                </span>
              )}
            </div>
            <p className="tw-m-0 tw-mt-1.5 tw-text-sm tw-text-ink-muted dark:tw-text-ink-dark-muted">
              Track confirmed events from planning through to completion.
            </p>
          </div>
        </div>
      </section>

      <div className="tw-mb-6 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-6">
        <StatCard
          label="Total Orders"
          value={stats?.total ?? 0}
          icon={<Inventory2Icon />}
          tone="blue"
          onClick={() => {
            setStatus('');
            setPage(1);
          }}
          selected={status === ''}
        />
        <StatCard
          label="Today Events"
          value={stats?.todayEvents ?? 0}
          icon={<TodayIcon />}
          tone="cyan"
          onClick={() => toggleQuickRange('TODAY')}
          selected={quickRange === 'TODAY'}
        />
        <StatCard
          label="Tomorrow Events"
          value={stats?.tomorrowEvents ?? 0}
          icon={<EventIcon />}
          tone="amber"
          onClick={() => toggleQuickRange('TOMORROW')}
          selected={quickRange === 'TOMORROW'}
        />
        <StatCard
          label="This Week Events"
          value={stats?.thisWeekEvents ?? 0}
          icon={<CalendarViewWeekIcon />}
          tone="violet"
          onClick={() => toggleQuickRange('THIS_WEEK')}
          selected={quickRange === 'THIS_WEEK'}
        />
        <StatCard
          label="This Month Events"
          value={stats?.thisMonthEvents ?? 0}
          icon={<CalendarMonthIcon />}
          tone="slate"
          onClick={() => toggleQuickRange('THIS_MONTH')}
          selected={quickRange === 'THIS_MONTH'}
        />
        <StatCard
          label="Order Closed"
          value={stats?.closed ?? 0}
          icon={<EventAvailableIcon />}
          tone="green"
          onClick={() => toggleStatus('ORDER_CLOSED')}
          selected={status === 'ORDER_CLOSED'}
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
          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end', flexWrap: 'wrap', rowGap: 2 }}>
            <CustomerFilter
              sx={{ width: 220 }}
              value={customer}
              onChange={(next) => {
                setCustomer(next);
                setPage(1);
              }}
            />

            <DateRangeFilter
              variant="floating"
              label="Event Date Range"
              sx={{ width: 180 }}
              value={quickRange ?? ''}
              onChange={applyDateRange}
            />

            <Box sx={{ width: 175 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Order Status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as OrderStatus | '');
                  setPage(1);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {resolveStatusConfig('order', option).label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ width: 150 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Payment"
                value={paymentStatus}
                onChange={(event) => {
                  setPaymentStatus(event.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Payments</MenuItem>
                {PAYMENT_FILTER_OPTIONS.map((option) => (
                  <MenuItem key={option.status} value={option.status}>
                    {resolveStatusConfig(option.type, option.status).label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ width: 160 }}>
              <DatePicker
                label="Month"
                views={['year', 'month']}
                openTo="month"
                value={month}
                onChange={(value: Dayjs | null) => {
                  setMonth(value);
                  setQuickRange(null);
                  setPage(1);
                }}
                slotProps={{ textField: { size: 'small', fullWidth: true }, field: { clearable: true } }}
              />
            </Box>

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

      {canView ? (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          loading={isLoading}
          meta={data?.meta}
          page={page}
          limit={limit}
          rowAccentColor={(row) => ORDER_ROW_ACCENT[row.status]}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          onRowClick={(row) => navigate(`/orders/${row.id}`)}
          emptyState={{
            icon: <Inventory2Icon sx={{ fontSize: 36 }} />,
            title: 'No Orders Found',
            description: 'Orders appear here automatically once an enquiry is confirmed.',
            action: <Button onClick={resetFilters}>Reset Filters</Button>,
          }}
          exportFileName="orders"
          canExport={canExport}
        />
      ) : (
        <Typography color="text.secondary">You do not have access to view orders.</Typography>
      )}

      <Menu
        anchorEl={statusMenu?.anchor}
        open={Boolean(statusMenu)}
        onClose={() => setStatusMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { minWidth: 190 } } }}
      >
        <ListSubheader sx={{ lineHeight: 2.2, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Move to
        </ListSubheader>
        {(statusMenu ? allowedOrderTransitions(statusMenu.row.status, statusPermissions) : []).map((option) => (
          <MenuItem
            key={option}
            onClick={() => {
              if (statusMenu) setPendingStatus({ row: statusMenu.row, target: option });
              setStatusMenu(null);
            }}
          >
            <StatusBadge type="order" status={option} size="sm" />
          </MenuItem>
        ))}
      </Menu>

      <ConfirmDialog
        open={pendingStatus !== null}
        title="Update Order Status?"
        message={
          pendingStatus
            ? `Move order "${pendingStatus.row.orderNumber}" to ${resolveStatusConfig('order', pendingStatus.target).label}?${
                statusError ? ` ${statusError}` : ''
              }`
            : ''
        }
        danger={pendingStatus?.target === 'REJECTED'}
        loading={statusMutation.isPending}
        onConfirm={handleConfirmStatus}
        onClose={() => {
          setPendingStatus(null);
          setStatusError(null);
        }}
      />
    </Box>
  );
}
