import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerFilter } from '../../components/CustomerFilter';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DatePickerField } from '../../components/DatePickerField';
import { CUSTOM_DATE_RANGE, DateRangeFilter, type DateRangeValue } from '../../components/DateRangeFilter';
import { LastUpdated } from '../../components/LastUpdated';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { resolveStatusConfig } from '../../components/statusConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { CARD_SURFACE } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';
import { SelectField } from '../../components/ui/Select';
import { usePermission } from '../../hooks/usePermission';
import * as paymentTrackerService from '../../services/paymentTrackerService';
import type { CustomerOption } from '../../types/masters';
import type { OrderStatus } from '../../types/order';
import type { PaymentTrackerRecord, PaymentTrackerStatus, PaymentTrackerStatusGroup } from '../../types/paymentTracker';
import { DATE_RANGE_LABELS, dateRangeBounds, type DateRangePreset } from '../../utils/dateRange';
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

// "payment/payment.md" §Filters — named ranges over the event date, offered from the toolbar's
// Date Range dropdown alongside the custom From/To range that the dropdown's own "Custom Range"
// option hands over to in Advanced Filters. Unlike the other event-date modules this one leads
// with the windows that have already closed: collection is chased against events that have run.
// Single days are not offered at all — a day's worth of events is too narrow to read a payment
// position from, and Custom Range covers the rare case.
const DATE_RANGE_PRESETS: readonly DateRangePreset[] = [
  'LAST_WEEK',
  'LAST_MONTH',
  'THIS_WEEK',
  'NEXT_WEEK',
  'THIS_MONTH',
  'NEXT_MONTH',
];

const STATUS_GROUP_LABELS: Record<PaymentTrackerStatusGroup, string> = {
  COLLECTED: 'Collected',
  PENDING: 'Pending',
};

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
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentTrackerStatus | ''>('');
  const [statusGroup, setStatusGroup] = useState<PaymentTrackerStatusGroup | ''>('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus | ''>('');
  const [dateRange, setDateRange] = useState<DateRangeValue>('');
  const [customFrom, setCustomFrom] = useState<Dayjs | null>(null);
  const [customTo, setCustomTo] = useState<Dayjs | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(Boolean(customer) || Boolean(paymentStatus) || Boolean(orderStatus) || Boolean(dateRange) || Boolean(customFrom || customTo));
  const [editRecord, setEditRecord] = useState<PaymentTrackerRecord | null>(null);
  const [historyRecord, setHistoryRecord] = useState<PaymentTrackerRecord | null>(null);

  // The Date Range dropdown and the custom From/To (Advanced Filters) both resolve to one
  // event-date window: a named preset computes its own bounds, and "Custom Range" — like leaving
  // the dropdown unset — defers to whatever the date fields hold, so the two can never fight.
  const preset = dateRange && dateRange !== CUSTOM_DATE_RANGE ? dateRange : null;
  const range = preset
    ? dateRangeBounds(preset)
    : customFrom || customTo
      ? { from: customFrom, to: customTo }
      : null;

  const eventDateFrom = range?.from ? range.from.format('YYYY-MM-DD') : undefined;
  const eventDateTo = range?.to ? range.to.format('YYYY-MM-DD') : undefined;
  const dateFilterCount = [customFrom, customTo].filter(Boolean).length;

  // Narrows along with every active filter (customer, payment status, order status, event
  // date range) except the card selection itself — the tiles are click-filters, so they keep
  // showing their full counts while one is selected.
  const { data: stats } = useQuery({
    queryKey: [
      'payment-tracker',
      'stats',
      { paymentStatus, orderStatus, customerId: customer?.id, eventDateFrom, eventDateTo },
    ],
    queryFn: () =>
      paymentTrackerService.getStats({
        customerId: customer?.id,
        paymentStatus: paymentStatus || undefined,
        orderStatus: orderStatus || undefined,
        eventDateFrom,
        eventDateTo,
      }),
    enabled: canView,
    placeholderData: keepPreviousData,
  });

  // The cards count orders, not money. Collected = any order with a receipt (Advance, Partial or
  // Fully Paid); Pending = every order not yet Fully Paid, i.e. still carrying a balance.
  const totalOrders = stats?.totalOrders ?? 0;
  const advanceCount = stats?.advanceCount ?? 0;
  const partialCount = stats?.partialCount ?? 0;
  const completedCount = stats?.completedCount ?? 0;
  const collectedSubtext = advanceCount > 0 || partialCount > 0 || completedCount > 0
    ? [advanceCount > 0 && `${advanceCount} advance`, partialCount > 0 && `${partialCount} partial`, completedCount > 0 && `${completedCount} completed`].filter(Boolean).join(' | ')
    : '';

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [
      'payment-tracker',
      'list',
      { page, limit, paymentStatus, statusGroup, orderStatus, customerId: customer?.id, eventDateFrom, eventDateTo },
    ],
    queryFn: () =>
      paymentTrackerService.list({
        page,
        limit,
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

  function resetFilters() {
    setCustomer(null);
    setPaymentStatus('');
    setStatusGroup('');
    setOrderStatus('');
    setDateRange('');
    setCustomFrom(null);
    setCustomTo(null);
    setPage(1);
  }

  // Clicking the active card again releases it; the Total card is simply "no group". A card and
  // the Payment Status dropdown are two routes to the same filter, so choosing one clears the other.
  function toggleStatusGroup(group: PaymentTrackerStatusGroup | '') {
    setStatusGroup((current) => (current === group ? '' : group));
    setPaymentStatus('');
    setPage(1);
  }

  // Picking a named window discards any custom From/To, so the range shown is always the one the
  // dropdown names. "Custom Range" instead opens Advanced Filters, where those fields live.
  function applyDateRange(value: DateRangeValue) {
    setDateRange(value);
    if (value === CUSTOM_DATE_RANGE) {
      setAdvancedOpen(true);
    } else {
      setCustomFrom(null);
      setCustomTo(null);
    }
    setPage(1);
  }

  // Editing either date field is what "Custom Range" means. The bound the user did not touch is
  // carried over from whatever is on screen, so switching off a named window narrows the range instead
  // of half-clearing it.
  function applyCustomBound(patch: { from?: Dayjs | null; to?: Dayjs | null }) {
    if (patch.from !== undefined) setCustomFrom(patch.from);
    if (patch.to !== undefined) setCustomTo(patch.to);
    setDateRange(CUSTOM_DATE_RANGE);
    setPage(1);
  }

  // Everything currently narrowing the list, as individually removable chips — so an unexpected
  // result count always has a visible cause, and one filter can be dropped without a full reset.
  const activeFilters: ActiveFilterChip[] = [];
  if (customer) {
    activeFilters.push({
      key: 'customer',
      label: `Customer: ${customer.customerName}`,
      onClear: () => {
        setCustomer(null);
      },
    });
  }
  if (statusGroup) {
    activeFilters.push({
      key: 'statusGroup',
      label: `Orders: ${STATUS_GROUP_LABELS[statusGroup]}`,
      onClear: () => setStatusGroup(''),
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
  if (preset) {
    activeFilters.push({
      key: 'dateRange',
      label: DATE_RANGE_LABELS[preset],
      onClear: () => setDateRange(''),
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
        setDateRange('');
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
            Number(row.paidAmount) > 0 ? 'tw-text-success' : 'tw-text-ink dark:tw-text-ink-dark'}
          `}
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
            Number(row.pendingAmount) > 0 ? 'tw-text-warning' : 'tw-text-ink-muted dark:tw-text-ink-dark-muted'}
          `}
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
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Payment Tracker' }]}
        titleAdornment={
          totalRecords === undefined ? undefined : (
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-slate-100 tw-px-2.5 tw-py-0.5 tw-text-[0.6875rem] tw-font-semibold tw-text-ink-muted dark:tw-bg-slate-700 dark:tw-text-ink-dark-muted">
              {totalRecords} {totalRecords === 1 ? 'record' : 'records'}
            </span>
          )
        }
        actions={
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 sm:tw-gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="tw-h-8 sm:tw-h-9"
              startIcon={<FilterListIcon fontSize="small" />}
              onClick={() => setShowFilters((prev) => !prev)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <LastUpdated timestamp={dataUpdatedAt} refreshing={isFetching} onRefresh={() => void refetch()} />
          </div>
        }
      />

      {/* §Dashboard Cards — three order counts, each a click-filter on the list below. */}
      <div className="tw-mb-4 tw-grid tw-grid-cols-1 tw-gap-2 sm:tw-grid-cols-3 sm:tw-gap-4">
        <StatCard
          label="Total Orders"
          value={totalOrders}
          icon={<SavingsIcon />}
          tone="cyan"
          selected={statusGroup === '' && !paymentStatus}
          onClick={() => toggleStatusGroup('')}
        />
        <StatCard
          label="Collected Orders"
          value={advanceCount + partialCount + completedCount}
          icon={<TrendingUpIcon />}
          tone="green"
          subtext={collectedSubtext}
          selected={statusGroup === 'COLLECTED'}
          onClick={() => toggleStatusGroup('COLLECTED')}
        />
        <StatCard
          label="Pending Orders"
          value={totalOrders - completedCount}
          icon={<AccountBalanceWalletIcon />}
          tone="orange"
          selected={statusGroup === 'PENDING'}
          onClick={() => toggleStatusGroup('PENDING')}
        />
      </div>

      {showFilters && (
      <div className={`${CARD_SURFACE} tw-mb-4 tw-flex tw-flex-col tw-gap-2.5 tw-px-3 tw-py-2.5`}>
        {/* Primary row: always visible. The dropdowns carry a label block above the box, so
            everything bottom-aligns and the input boxes themselves stay on one line. Advanced
            Filters closes the row on the right. */}
        <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-flex-wrap sm:tw-items-end">
          {/* The shared customer type-ahead — an MUI control, but its fixed 40px height keeps its
              bottom edge level with the Tailwind fields it sits beside. */}
          <CustomerFilter
            className="tw-w-full sm:tw-w-auto sm:tw-flex-1 sm:tw-basis-[170px]"
            value={customer}
            onChange={(next) => {
              setCustomer(next);
              setPage(1);
            }}
          />

          <SelectField
            className="tw-w-full sm:tw-w-auto sm:tw-flex-1 sm:tw-basis-[170px]"
            label="Payment Status"
            emptyLabel="All"
            value={paymentStatus}
            onChange={(value) => {
              setPaymentStatus(value as PaymentTrackerStatus | '');
              setStatusGroup('');
              setPage(1);
            }}
            options={PAYMENT_STATUS_OPTIONS.map((option) => ({
              value: option,
              label: resolveStatusConfig('paymentTracker', option).label,
            }))}
          />

          <SelectField
            className="tw-w-full sm:tw-w-auto sm:tw-flex-1 sm:tw-basis-[170px]"
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

          <DateRangeFilter
            className="tw-w-full sm:tw-w-auto sm:tw-flex-1 sm:tw-basis-[150px]"
            presets={DATE_RANGE_PRESETS}
            value={dateRange}
            onChange={applyDateRange}
            custom
          />

          <Button
            variant="ghost"
            className="tw-w-full sm:tw-w-auto"
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
                      onChange={(value) => applyCustomBound({ from: value })}
                    />
                  </div>
                  <div className="tw-flex-1">
                    <DatePickerField
                      label="Event Date To"
                      margin="none"
                      minDate={customFrom ?? undefined}
                      value={customTo}
                      onChange={(value) => applyCustomBound({ to: value })}
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
      )}

      {canView ? (
        <DataTable
          columns={columns}
          rows={data?.records ?? []}
          getRowId={(row) => row.id}
          meta={data?.meta}
          loading={isLoading}
          canExport={canExport}
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
            action:
              activeFilters.length > 0 ? (
                <Button onClick={resetFilters}>Reset Filters</Button>
              ) : undefined,
          }}
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