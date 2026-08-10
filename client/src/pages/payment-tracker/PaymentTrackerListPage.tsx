import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SavingsIcon from '@mui/icons-material/Savings';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TuneIcon from '@mui/icons-material/Tune';
import UpdateIcon from '@mui/icons-material/Update';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Autocomplete, TextField } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DatePickerField } from '../../components/DatePickerField';
import { LastUpdated } from '../../components/LastUpdated';
import { PageHeader } from '../../components/PageHeader';
import { QuickFilterPill } from '../../components/QuickFilterPill';
import { SearchBar } from '../../components/SearchBar';
import { StatCard } from '../../components/StatCard';
import { resolveStatusConfig } from '../../components/statusConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { CARD_SURFACE } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';
import { SelectField } from '../../components/ui/Select';
import { usePermission } from '../../hooks/usePermission';
import * as customerService from '../../services/customerService';
import * as paymentTrackerService from '../../services/paymentTrackerService';
import type { CustomerOption } from '../../types/masters';
import type { OrderStatus } from '../../types/order';
import type { PaymentTrackerRecord, PaymentTrackerStatus } from '../../types/paymentTracker';
import { eventProximity, formatCurrency, formatDate } from '../../utils/format';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import { PaymentTrackerEditDialog } from './PaymentTrackerEditDialog';

// Rejected orders never reach this module (they carry no payment obligation), so they are not
// offered as a filter either.
const ORDER_STATUS_OPTIONS: OrderStatus[] = ['YET_TO_START', 'IN_PROGRESS', 'ORDER_CLOSED'];

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
  FULLY_PAID: '#10B981',
};

// "payment/payment.md" §Filters — one-at-a-time quick ranges over the event date, alongside the
// custom From/To range in Advanced Filters.
type QuickRange = 'THIS_WEEK' | 'NEXT_WEEK' | 'THIS_MONTH' | 'NEXT_MONTH';

// Each range carries its own icon rather than all four repeating one generic calendar — an icon
// that's identical across every pill carries no information and just adds visual noise
// ("md files/Enquiry/UI1.md" §Quick Filters).
const QUICK_RANGES: { key: QuickRange; label: string; icon: ReactNode }[] = [
  { key: 'THIS_WEEK', label: 'This Week', icon: <DateRangeIcon fontSize="small" /> },
  { key: 'NEXT_WEEK', label: 'Next Week', icon: <UpdateIcon fontSize="small" /> },
  { key: 'THIS_MONTH', label: 'This Month', icon: <CalendarMonthIcon fontSize="small" /> },
  { key: 'NEXT_MONTH', label: 'Next Month', icon: <ScheduleIcon fontSize="small" /> },
];

// Filter controls grow to share whatever width the search bar leaves, rather than sitting at a
// fixed size and stranding empty space at the row's right edge.
const FILTER_FIELD_WIDTH = 'tw-w-full tw-flex-1 sm:tw-basis-[170px]';

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

interface ActiveFilterChip {
  key: string;
  label: string;
  onClear: () => void;
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
  const [orderStatus, setOrderStatus] = useState<OrderStatus | ''>('');
  const [quickRange, setQuickRange] = useState<QuickRange | null>(null);
  const [customFrom, setCustomFrom] = useState<Dayjs | null>(null);
  const [customTo, setCustomTo] = useState<Dayjs | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<PaymentTrackerRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<PaymentTrackerRecord | null>(null);

  // The quick-range pills and the custom From/To (Advanced Filters) both resolve to one
  // event-date window; whichever was set last wins, so they can never silently fight each other.
  const range = quickRange
    ? quickRangeDates(quickRange)
    : customFrom || customTo
      ? { from: customFrom, to: customTo }
      : null;

  const eventDateFrom = range?.from ? range.from.format('YYYY-MM-DD') : undefined;
  const eventDateTo = range?.to ? range.to.format('YYYY-MM-DD') : undefined;
  const hasDateFilter = Boolean(quickRange || customFrom || customTo);
  const dateFilterCount = [customFrom, customTo].filter(Boolean).length;

  // Narrows along with every active filter (search, customer, payment status, order status, event
  // date range) — these are plain summary tiles, not click-filters, so unlike the Enquiry/Order
  // dashboard cards there's no "own" filter to leave out.
  const { data: stats } = useQuery({
    queryKey: [
      'payment-tracker',
      'stats',
      { search, paymentStatus, orderStatus, customerId: customer?.id, eventDateFrom, eventDateTo },
    ],
    queryFn: () =>
      paymentTrackerService.getStats({
        search: search || undefined,
        customerId: customer?.id,
        paymentStatus: paymentStatus || undefined,
        orderStatus: orderStatus || undefined,
        eventDateFrom,
        eventDateTo,
      }),
    enabled: canView,
    placeholderData: keepPreviousData,
  });

  const { data: customerOptions } = useQuery({
    queryKey: ['customers', 'search', customerQuery],
    queryFn: () => customerService.search(customerQuery),
    enabled: customerQuery.trim().length > 0,
  });

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [
      'payment-tracker',
      'list',
      { page, limit, search, paymentStatus, orderStatus, customerId: customer?.id, eventDateFrom, eventDateTo },
    ],
    queryFn: () =>
      paymentTrackerService.list({
        page,
        limit,
        search: search || undefined,
        customerId: customer?.id,
        paymentStatus: paymentStatus || undefined,
        orderStatus: orderStatus || undefined,
        eventDateFrom,
        eventDateTo,
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  function resetFilters() {
    setSearch('');
    setCustomer(null);
    setCustomerQuery('');
    setPaymentStatus('');
    setOrderStatus('');
    setQuickRange(null);
    setCustomFrom(null);
    setCustomTo(null);
    setPage(1);
  }

  function applyQuickRange(key: QuickRange | null) {
    setQuickRange((current) => (current === key ? null : key));
    setCustomFrom(null);
    setCustomTo(null);
    setPage(1);
  }

  // Everything currently narrowing the list, as individually removable chips — so an unexpected
  // result count always has a visible cause, and one filter can be dropped without a full reset.
  const activeFilters: ActiveFilterChip[] = [];
  if (search) {
    activeFilters.push({
      key: 'search',
      label: `Search: "${search}"`,
      onClear: () => setSearch(''),
    });
  }
  if (customer) {
    activeFilters.push({
      key: 'customer',
      label: `Customer: ${customer.customerName}`,
      onClear: () => {
        setCustomer(null);
        setCustomerQuery('');
      },
    });
  }
  if (paymentStatus) {
    activeFilters.push({
      key: 'paymentStatus',
      label: `Payment: ${resolveStatusConfig('paymentTracker', paymentStatus).label}`,
      onClear: () => setPaymentStatus(''),
    });
  }
  if (orderStatus) {
    activeFilters.push({
      key: 'orderStatus',
      label: `Order: ${resolveStatusConfig('order', orderStatus).label}`,
      onClear: () => setOrderStatus(''),
    });
  }
  if (quickRange) {
    activeFilters.push({
      key: 'quickRange',
      label: QUICK_RANGES.find((option) => option.key === quickRange)!.label,
      onClear: () => setQuickRange(null),
    });
  } else if (customFrom || customTo) {
    activeFilters.push({
      key: 'customRange',
      label: `Event ${customFrom ? formatDate(customFrom.toISOString()) : '…'} – ${
        customTo ? formatDate(customTo.toISOString()) : '…'
      }`,
      onClear: () => {
        setCustomFrom(null);
        setCustomTo(null);
      },
    });
  }

  const columns: DataTableColumn<PaymentTrackerRecord>[] = [
    {
      key: 'orderNumber',
      header: 'Order No',
      sortable: true,
      align: 'center' as const,
      width: 150,
      render: (row) => (
        <span className="tw-block tw-truncate tw-font-bold tw-tabular-nums tw-text-ink dark:tw-text-ink-dark">
          {row.orderNumber}
        </span>
      ),
      exportValue: (row) => row.orderNumber,
    },
    {
      key: 'customer',
      header: 'Customer',
      align: 'center' as const,
      width: 135,
      render: (row) => (
        <div className="tw-min-w-0">
          <div className="tw-truncate tw-font-semibold tw-leading-tight">{row.customer.customerName}</div>
          <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
            {row.customer.mobile}
          </div>
        </div>
      ),
      exportValue: (row) => row.customer.customerName,
    },
    {
      key: 'event',
      header: 'Event',
      align: 'center' as const,
      width: 130,
      render: (row) => (
        <span className="tw-block tw-truncate">
          {row.enquiry?.eventName || row.enquiry?.eventType.eventName || '—'}
        </span>
      ),
      exportValue: (row) => row.enquiry?.eventName || row.enquiry?.eventType.eventName || '',
    },
    {
      key: 'eventDate',
      header: 'Event Date',
      align: 'center' as const,
      width: 125,
      render: (row) => {
        // An order confirmed before its event date was known has no day or countdown to show.
        if (!row.eventDate) {
          return <div className="tw-truncate tw-text-ink-muted dark:tw-text-ink-dark-muted">Not scheduled</div>;
        }
        const proximity = eventProximity(row.eventDate);
        return (
          <div className="tw-min-w-0">
            <div className="tw-truncate tw-font-semibold">{formatDate(row.eventDate)}</div>
            <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
              {dayjs(row.eventDate).format('ddd')} ·{' '}
              <span className={proximity.urgent ? 'tw-font-bold tw-text-warning' : undefined}>{proximity.text}</span>
            </div>
          </div>
        );
      },
      exportValue: (row) => formatDate(row.eventDate),
    },
    {
      key: 'status',
      header: 'Order Status',
      align: 'center' as const,
      width: 130,
      render: (row) => <StatusBadge type="order" status={row.status} size="sm" />,
      exportValue: (row) => row.status,
    },
    {
      key: 'totalAmount',
      header: 'Budget',
      align: 'center' as const,
      width: 115,
      render: (row) => <span className="tw-tabular-nums">{formatCurrency(row.totalAmount)}</span>,
      exportValue: (row) => row.totalAmount,
    },
    {
      key: 'paidAmount',
      header: 'Collected',
      align: 'center' as const,
      width: 115,
      render: (row) => (
        <span
          className={`tw-tabular-nums tw-font-semibold ${
            Number(row.paidAmount) > 0 ? 'tw-text-success' : 'tw-text-ink dark:tw-text-ink-dark'
          }`}
        >
          {formatCurrency(row.paidAmount)}
        </span>
      ),
      exportValue: (row) => row.paidAmount,
    },
    {
      key: 'pendingAmount',
      header: 'Balance',
      align: 'center' as const,
      width: 115,
      render: (row) => (
        <span
          className={`tw-tabular-nums tw-font-semibold ${
            Number(row.pendingAmount) > 0 ? 'tw-text-warning' : 'tw-text-ink-muted dark:tw-text-ink-dark-muted'
          }`}
        >
          {formatCurrency(row.pendingAmount)}
        </span>
      ),
      exportValue: (row) => row.pendingAmount,
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      align: 'center' as const,
      width: 140,
      render: (row) => (
        <div>
          <StatusBadge type="paymentTracker" status={trackerStatus(row)} size="sm" />
          {/* A pinned status no longer follows the payments, so the row says so rather than
              leaving a stale-looking badge unexplained. */}
          {row.paymentTracker?.statusManual && (
            <div className="tw-mt-0.5 tw-text-[0.6875rem] tw-text-ink-muted dark:tw-text-ink-dark-muted">
              set manually
            </div>
          )}
        </div>
      ),
      exportValue: (row) => trackerStatus(row),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center' as const,
      width: 130,
      render: (row) => (
        <div className="tw-flex tw-justify-center tw-gap-0.5">
          <IconButton
            title="View payment details"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/payment-tracker/${row.id}`);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {canEdit && (
            <IconButton
              title="Edit payment"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setEditRecord(row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            title="Payment history"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setHistoryRecord(row);
            }}
          >
            <HistoryIcon fontSize="small" />
          </IconButton>
          <IconButton
            title="Invoice"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/payment-tracker/${row.id}/invoice`);
            }}
          >
            <ReceiptIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    } satisfies DataTableColumn<PaymentTrackerRecord>,
  ];

  const totalRecords = data?.meta?.totalRecords;

  return (
    <div>
      <PageHeader
        title="Payment Tracker"
        subtitle="Budget, collections and outstanding balance for every confirmed order."
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Payment Tracker' }]}
        titleAdornment={
          totalRecords === undefined ? undefined : (
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-slate-100 tw-px-2.5 tw-py-0.5 tw-text-[0.6875rem] tw-font-semibold tw-text-ink-muted dark:tw-bg-slate-700 dark:tw-text-ink-dark-muted">
              {totalRecords} {totalRecords === 1 ? 'record' : 'records'}
            </span>
          )
        }
        actions={<LastUpdated timestamp={dataUpdatedAt} refreshing={isFetching} onRefresh={() => void refetch()} />}
      />

      {/* §Dashboard Cards — three money totals, each with a subtext breakdown of the orders behind
          it. Plain summary tiles rather than click-filters: the toolbar's own Payment Status /
          Order Status dropdowns already cover that, and these three narrow along with whatever is
          set there (see the stats query above). */}
      <div className="tw-mb-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-3">
        <StatCard
          label="Total Expected Amount"
          value={formatCurrency(stats?.totalExpectedAmount ?? 0)}
          subtext={`${stats?.totalOrders ?? 0} Total Orders`}
          icon={<SavingsIcon />}
          tone="cyan"
        />
        <StatCard
          label="Collected Amount"
          value={formatCurrency(stats?.totalCollected ?? 0)}
          subtext={`Advance ${stats?.advanceCount ?? 0} · Partial ${stats?.partialCount ?? 0} · Completed ${stats?.completedCount ?? 0}`}
          icon={<TrendingUpIcon />}
          tone="green"
        />
        <StatCard
          label="Pending Amount"
          value={formatCurrency(stats?.pendingAmount ?? 0)}
          icon={<AccountBalanceWalletIcon />}
          tone="orange"
        />
      </div>

      <div className={`${CARD_SURFACE} tw-mb-4 tw-flex tw-flex-col tw-gap-2.5 tw-px-3 tw-py-2.5`}>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <QuickFilterPill label="All Dates" active={!hasDateFilter} onClick={() => applyQuickRange(null)} />
          {QUICK_RANGES.map((option) => (
            <QuickFilterPill
              key={option.key}
              label={option.label}
              icon={option.icon}
              active={quickRange === option.key}
              onClick={() => applyQuickRange(option.key)}
            />
          ))}
        </div>

        {/* Primary row: always visible. Search takes the remaining width. The dropdowns carry a
            label block above the box, so everything bottom-aligns and the input boxes themselves
            stay on one line. Advanced Filters closes the row on the right. */}
        <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-2.5">
          <div className="tw-flex-[2] tw-basis-[240px]">
            <SearchBar
              fullWidth
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by order no, customer, mobile..."
            />
          </div>

          {/* MUI Autocomplete — the one control here with no Tailwind equivalent (customer
              type-ahead search); the fixed 40px height keeps its bottom edge level with the
              Tailwind fields it sits beside. */}
          <div className={FILTER_FIELD_WIDTH}>
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
          </div>

          <SelectField
            className={FILTER_FIELD_WIDTH}
            label="Payment Status"
            emptyLabel="All"
            value={paymentStatus}
            onChange={(value) => {
              setPaymentStatus(value as PaymentTrackerStatus | '');
              setPage(1);
            }}
            options={PAYMENT_STATUS_OPTIONS.map((option) => ({
              value: option,
              label: resolveStatusConfig('paymentTracker', option).label,
            }))}
          />

          <SelectField
            className={FILTER_FIELD_WIDTH}
            label="Order Status"
            emptyLabel="All"
            value={orderStatus}
            onChange={(value) => {
              setOrderStatus(value as OrderStatus | '');
              setPage(1);
            }}
            options={ORDER_STATUS_OPTIONS.map((option) => ({
              value: option,
              label: resolveStatusConfig('order', option).label,
            }))}
          />

          <Button
            variant="ghost"
            onClick={() => setAdvancedOpen((previous) => !previous)}
            startIcon={<TuneIcon fontSize="small" />}
            endIcon={
              <ExpandMoreIcon
                fontSize="small"
                className={`tw-transition-transform tw-duration-200 ${advancedOpen ? 'tw-rotate-180' : ''}`}
              />
            }
          >
            Advanced Filters{dateFilterCount > 0 ? ` (${dateFilterCount})` : ''}
          </Button>
        </div>

        {/* Advanced row: custom event-date range, collapsed by default. The 0fr→1fr grid track
            animates the reveal without needing a measured pixel height. */}
        <div
          className={`tw-grid tw-transition-all tw-duration-200 ${
            advancedOpen ? 'tw-grid-rows-[1fr] tw-opacity-100' : '-tw-mt-2.5 tw-grid-rows-[0fr] tw-opacity-0'
          }`}
        >
          <div className="tw-overflow-hidden">
            <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-2.5 tw-pt-0.5">
              <div className="tw-flex tw-flex-1 tw-basis-[320px] tw-gap-2">
                <div className="tw-flex-1">
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
                </div>
                <div className="tw-flex-1">
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <>
            <hr className="tw-my-0 tw-border-b tw-border-hairline dark:tw-border-hairline-dark" />
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <span className="tw-text-xs tw-font-semibold tw-text-ink-muted dark:tw-text-ink-dark-muted">
                Active filters
              </span>
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-hairline tw-bg-white tw-py-1 tw-pl-3 tw-pr-1 tw-text-xs tw-text-slate-600 dark:tw-border-hairline-dark dark:tw-bg-surface-dark dark:tw-text-ink-dark"
                >
                  {filter.label}
                  <IconButton title={`Remove filter: ${filter.label}`} size="xs" onClick={filter.onClear}>
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </span>
              ))}
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear all
              </Button>
            </div>
          </>
        )}
      </div>

      {canView ? (
        <DataTable
          columns={columns}
          rows={data?.records ?? []}
          getRowId={(row) => row.id}
          loading={isLoading}
          meta={data?.meta}
          page={page}
          limit={limit}
          fixedLayout
          dense
          stickyHeader
          maxHeight="calc(100vh - 260px)"
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
            title: activeFilters.length > 0 ? 'No payment records match these filters' : 'No Payment Records Found',
            description:
              activeFilters.length > 0
                ? 'Try widening the date range or clearing a filter.'
                : 'Records appear here automatically once an enquiry is confirmed as an order.',
            action: <Button onClick={resetFilters}>Reset Filters</Button>,
          }}
          exportFileName="payment-tracker"
          canExport={canExport}
        />
      ) : (
        <p className="tw-mt-2 tw-text-sm tw-text-ink-muted dark:tw-text-ink-dark-muted">
          You do not have access to view payments.
        </p>
      )}

      <PaymentTrackerEditDialog
        open={editRecord !== null}
        record={editRecord}
        onClose={() => setEditRecord(null)}
      />

      <PaymentHistoryDialog
        open={historyRecord !== null}
        record={historyRecord}
        onClose={() => setHistoryRecord(null)}
      />
    </div>
  );
}
