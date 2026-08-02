import CancelIcon from '@mui/icons-material/Cancel';
import ChecklistIcon from '@mui/icons-material/Checklist';
import DescriptionIcon from '@mui/icons-material/Description';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HistoryIcon from '@mui/icons-material/History';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PaymentsIcon from '@mui/icons-material/Payments';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
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
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatCard } from '../../components/StatCard';
import { derivePaymentStatus, resolveStatusConfig, type PaymentStatus } from '../../components/statusConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as customerService from '../../services/customerService';
import * as orderService from '../../services/orderService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type { CustomerOption } from '../../types/masters';
import type { OrderListItem, OrderStatus, OrderStatusGroup } from '../../types/order';
// Rows are ordered by event date (soonest first, server-side), so the date cell carries the
// scanning weight: weekday for planning, plus how near the event is (eventProximity).
import { eventProximity, formatCurrency, formatDate } from '../../utils/format';
import { allowedOrderTransitions } from './orderStatusTransitions';

// Event/work lifecycle only — payment standing is a separate derived column, so the three
// payment-shaped statuses aren't offered as filters here.
const STATUS_OPTIONS: OrderStatus[] = [
  'CONFIRMED',
  'PLANNING',
  'READY',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
  'CANCELLED',
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'];

// Row-left accent per order status, mirroring statusConfig.ts's semantic grouping as literal
// values (DataTable's rowAccentColor callback runs outside a theme-aware sx function).
const ORDER_ROW_ACCENT: Record<OrderStatus, string> = {
  CONFIRMED: '#3B82F6',
  ADVANCE_PENDING: '#F59E0B',
  ADVANCE_RECEIVED: '#3B82F6',
  PLANNING: '#3B82F6',
  READY: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  COMPLETED: '#22C55E',
  BALANCE_PENDING: '#F59E0B',
  CLOSED: '#22C55E',
  CANCELLED: '#EF4444',
};

// "md files/order/filter.md" §Date Filter — one-at-a-time quick ranges over the event date.
type QuickRange = 'TODAY' | 'THIS_WEEK' | 'NEXT_WEEK' | 'THIS_MONTH' | 'NEXT_MONTH';

const QUICK_RANGES: { key: QuickRange; label: string }[] = [
  { key: 'TODAY', label: 'Today' },
  { key: 'THIS_WEEK', label: 'This Week' },
  { key: 'NEXT_WEEK', label: 'Next Week' },
  { key: 'THIS_MONTH', label: 'This Month' },
  { key: 'NEXT_MONTH', label: 'Next Month' },
];

function quickRangeDates(key: QuickRange): { from: Dayjs; to: Dayjs } {
  const today = dayjs();
  switch (key) {
    case 'TODAY':
      return { from: today, to: today };
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
  const canViewPlanning = usePermission('PLANNING', 'canView');

  const [menuState, setMenuState] = useState<{ anchor: HTMLElement; row: OrderListItem } | null>(null);
  const [statusMenu, setStatusMenu] = useState<{ anchor: HTMLElement; row: OrderListItem } | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [statusGroup, setStatusGroup] = useState<OrderStatusGroup | ''>('');
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [quickRange, setQuickRange] = useState<QuickRange | null>(null);
  const [month, setMonth] = useState<Dayjs | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ row: OrderListItem; target: OrderStatus } | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // The quick-range pills and the month picker both resolve to one event-date window; whichever
  // was set last wins, so they can't silently fight each other.
  const range = quickRange
    ? quickRangeDates(quickRange)
    : month
      ? { from: month.startOf('month'), to: month.endOf('month') }
      : null;

  const { data: stats } = useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: () => orderService.getStats(),
    enabled: canView,
  });

  const { data: customerOptions } = useQuery({
    queryKey: ['customers', 'search', customerQuery],
    queryFn: () => customerService.search(customerQuery),
    enabled: customerQuery.trim().length > 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'orders',
      {
        page,
        limit,
        search,
        status,
        statusGroup,
        customerId: customer?.id,
        from: range?.from.format('YYYY-MM-DD'),
        to: range?.to.format('YYYY-MM-DD'),
      },
    ],
    queryFn: () =>
      orderService.list({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
        statusGroup: statusGroup || undefined,
        customerId: customer?.id,
        eventDateFrom: range ? range.from.format('YYYY-MM-DD') : undefined,
        eventDateTo: range ? range.to.format('YYYY-MM-DD') : undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: OrderStatus; cancellationReason?: string }) =>
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
        // The server requires a reason when cancelling; inline editing has no free-text field, so
        // a fixed one is sent and the detail page remains the place to record a fuller reason.
        cancellationReason: pendingStatus.target === 'CANCELLED' ? 'Cancelled from the Orders list.' : undefined,
      });
      setPendingStatus(null);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) setStatusError(error.response.data.message);
      else setStatusError('Unable to update the order status.');
    }
  }

  function resetFilters() {
    setSearch('');
    setStatus('');
    setStatusGroup('');
    setPaymentStatus('');
    setCustomer(null);
    setCustomerQuery('');
    setQuickRange(null);
    setMonth(null);
    setPage(1);
  }

  // Payment status is derived per row rather than stored, so it can't be a server-side `where`
  // clause — it's filtered on the current page after fetching.
  const rows = (data?.records ?? []).filter(
    (row) =>
      !paymentStatus || derivePaymentStatus(row.totalAmount, row.paidAmount, row.eventDate) === paymentStatus,
  );

  function toggleGroup(group: OrderStatusGroup) {
    setStatusGroup((current) => (current === group ? '' : group));
    setStatus('');
    setPage(1);
  }

  const columns: DataTableColumn<OrderListItem>[] = [
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
      render: (row) => row.customer.customerName,
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
      key: 'venue',
      header: 'Venue',
      // Hidden by default to keep the 11-column table inside the viewport — re-enable any time
      // from the column picker in the table toolbar.
      hideByDefault: true,
      render: (row) => row.venue ?? '—',
      exportValue: (row) => row.venue ?? '',
    },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      width: 110,
      render: (row) => formatCurrency(row.totalAmount),
      exportValue: (row) => row.totalAmount,
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      width: 100,
      render: (row) => formatCurrency(row.paidAmount),
      exportValue: (row) => row.paidAmount,
    },
    {
      key: 'pendingAmount',
      header: 'Balance',
      align: 'right',
      width: 110,
      render: (row) => formatCurrency(row.pendingAmount),
      exportValue: (row) => row.pendingAmount,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      align: 'center',
      // Derived from the order's own amounts, never stored
      // (docs/10_IMPLEMENTATION_DECISIONS.md §6). Read-only here: payments are recorded through
      // the Payments tab, and this badge just reflects the resulting balance.
      render: (row) => (
        <Box>
          <StatusBadge type="payment" status={derivePaymentStatus(row.totalAmount, row.paidAmount, row.eventDate)} size="sm" />
          {Number(row.pendingAmount) > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {formatCurrency(row.pendingAmount)} due
            </Typography>
          )}
        </Box>
      ),
      exportValue: (row) => derivePaymentStatus(row.totalAmount, row.paidAmount, row.eventDate),
    },
    {
      key: 'status',
      header: 'Event Status',
      align: 'center',
      width: 150,
      // Inline status editing ("md files/order/filter.md" §Inline Status Editing). Tracks the
      // EVENT/work lifecycle only — payment standing is the separate derived column above. The
      // badge itself is the trigger, so an editable cell reads exactly like a read-only one
      // (no form control breaking the row rhythm) and only reveals the menu affordance. The menu
      // offers only the moves the backend accepts from this row's current status
      // (ORDER_STATUS_TRANSITIONS), so the documented workflow stays intact rather than being
      // bypassed; the server's "can't close with a balance" guard surfaces in the confirm dialog.
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
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'flex-end' }}>
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
          {canViewPlanning && (
            <Tooltip title="Task plan">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/orders/${row.id}?tab=task-plan`);
                }}
              >
                <ChecklistIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="More">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setMenuState({ anchor: event.currentTarget, row });
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Orders"
        subtitle="Track confirmed events from planning through to completion."
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Orders' }]}
      />

      <div className="tw-mb-6 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-5">
        <StatCard
          label="Total Orders"
          value={stats?.total ?? 0}
          icon={<Inventory2Icon />}
          tone="blue"
          onClick={() => {
            setStatusGroup('');
            setStatus('');
            setPage(1);
          }}
          selected={statusGroup === '' && status === ''}
        />
        <StatCard
          label="Planning"
          value={stats?.planning ?? 0}
          icon={<ChecklistIcon />}
          tone="cyan"
          onClick={() => toggleGroup('PLANNING')}
          selected={statusGroup === 'PLANNING'}
        />
        <StatCard
          label="Work Started"
          value={stats?.workStarted ?? 0}
          icon={<PlayCircleIcon />}
          tone="amber"
          onClick={() => toggleGroup('WORK_STARTED')}
          selected={statusGroup === 'WORK_STARTED'}
        />
        <StatCard
          label="Completed"
          value={stats?.completed ?? 0}
          icon={<EventAvailableIcon />}
          tone="green"
          onClick={() => toggleGroup('COMPLETED')}
          selected={statusGroup === 'COMPLETED'}
        />
        <StatCard
          label="Cancelled"
          value={stats?.cancelled ?? 0}
          icon={<CancelIcon />}
          tone="slate"
          onClick={() => toggleGroup('CANCELLED')}
          selected={statusGroup === 'CANCELLED'}
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
              color={quickRange === null && month === null ? 'primary' : 'default'}
              variant={quickRange === null && month === null ? 'filled' : 'outlined'}
              onClick={() => {
                setQuickRange(null);
                setMonth(null);
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
                  setMonth(null);
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

            <Box sx={{ width: 175 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Event Status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as OrderStatus | '');
                  setStatusGroup('');
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
                onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus | '')}
              >
                <MenuItem value="">All Payments</MenuItem>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {resolveStatusConfig('payment', option).label}
                  </MenuItem>
                ))}
              </TextField>
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

      <Menu anchorEl={menuState?.anchor} open={Boolean(menuState)} onClose={() => setMenuState(null)}>
        <MenuItem
          onClick={() => {
            if (menuState) navigate(`/orders/${menuState.row.id}?tab=quotation`);
            setMenuState(null);
          }}
        >
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Quotation</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuState) navigate(`/orders/${menuState.row.id}?tab=documents`);
            setMenuState(null);
          }}
        >
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Documents</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuState) navigate(`/orders/${menuState.row.id}?tab=timeline`);
            setMenuState(null);
          }}
        >
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Timeline</ListItemText>
        </MenuItem>
      </Menu>

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
        danger={pendingStatus?.target === 'CANCELLED'}
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
