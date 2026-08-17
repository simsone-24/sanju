import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TuneIcon from '@mui/icons-material/Tune';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CustomerFilter } from '../../components/CustomerFilter';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DatePickerField } from '../../components/DatePickerField';
import { CUSTOM_DATE_RANGE, DateRangeFilter, type DateRangeValue } from '../../components/DateRangeFilter';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { LastUpdated } from '../../components/LastUpdated';
import { StatCard } from '../../components/StatCard';
import { resolveStatusConfig } from '../../components/statusConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { SelectField } from '../../components/ui/Select';
import { usePermission } from '../../hooks/usePermission';
import * as enquiryService from '../../services/enquiryService';
import * as customerService from '../../services/customerService';
import type { ApiErrorResponse } from '../../types/api';
import type { AppointmentStatus, EnquiryListItem, EnquiryStatus, EnquiryStatusGroup } from '../../types/enquiry';
import type { CustomerOption } from '../../types/masters';
import { avatarHue, avatarInitials } from '../../utils/avatar';
import {
  DATE_RANGE_LABELS,
  dateRangeBounds,
  EVENT_DATE_PRESETS,
  toDateRangePreset,
  type DateRangePreset,
} from '../../utils/dateRange';
import { eventProximity, formatDate } from '../../utils/format';

const ENQUIRY_STATUS_OPTIONS: EnquiryStatus[] = [
  'PENDING',
  'APPOINTMENT_FIXED',
  'QUOTATION_TO_SHARE',
  'QUOTATION_SHARED',
  'ORDER_CONFIRMED',
  'ORDER_LOST',
];

const APPOINTMENT_STATUS_OPTIONS: AppointmentStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

// Row-left accent stripe per enquiry status — the same semantic grouping as ENQUIRY_STATUS_CONFIG
// in statusConfig.ts, as literal hex values since DataTable's rowAccentColor callback returns a
// bare CSS color rather than a class.
const ENQUIRY_ROW_ACCENT: Record<EnquiryStatus, string> = {
  PENDING: '#64748B',
  APPOINTMENT_FIXED: '#8B5CF6',
  QUOTATION_TO_SHARE: '#F59E0B',
  QUOTATION_SHARED: '#3B82F6',
  ORDER_CONFIRMED: '#10B981',
  ORDER_LOST: '#EF4444',
};

// "md files/Enquiry/UI1.md" §Quick Filters — named date ranges over the event date, all offered
// from the toolbar's single Date Range dropdown. Enquiries adds Upcoming to the shared
// forward-looking set: an enquiry list is most often read as "everything still ahead of us".
const QUICK_FILTERS: readonly DateRangePreset[] = [...EVENT_DATE_PRESETS, 'UPCOMING'];

const STATUS_GROUP_KEYS = new Set<string>(['ACTIVE', 'CONFIRMED', 'PENDING', 'APPOINTMENT_PENDING']);

// Filter controls grow to share the row's width rather than sitting at a fixed size and stranding
// empty space at its right edge. The basis is the width they settle at once the row is full enough
// to wrap.
const FILTER_FIELD_WIDTH = 'tw-w-full tw-flex-1 sm:tw-basis-[150px]';

function parseParamDate(value: string | null): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : null;
}

function formatParamDate(value: Dayjs | null): string | null {
  return value ? value.format('YYYY-MM-DD') : null;
}

// Deterministic initials avatar for people shown without a profile picture — the same name always
// yields the same initials and hue (utils/avatar.ts), so a row's customer or assignee is
// recognisable at a glance while scanning the list.
function InitialsAvatar({ name, seed, size = 'md' }: { name: string; seed: string; size?: 'sm' | 'md' }) {
  const hue = avatarHue(seed);
  return (
    <span
      aria-hidden
      className={[
        'tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-font-bold',
        size === 'sm' ? 'tw-h-6 tw-w-6 tw-text-[0.5625rem]' : 'tw-h-7 tw-w-7 tw-text-[0.625rem]',
      ].join(' ')}
      style={{ color: hue, backgroundColor: `color-mix(in srgb, ${hue} 16%, transparent)` }}
    >
      {avatarInitials(name)}
    </span>
  );
}

interface ActiveFilterChip {
  key: string;
  label: string;
  onClear: () => void;
}

export default function EnquiryListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canCreate = usePermission('ENQUIRIES', 'canCreate');
  const canExport = usePermission('ENQUIRIES', 'canExport');
  const canEdit = usePermission('ENQUIRIES', 'canEdit');
  const canDelete = usePermission('ENQUIRIES', 'canDelete');
  // The Customer filter is only meaningful to someone allowed to see the customer list it is
  // built from, so both the options query and the control itself hang off that permission.
  const canViewCustomers = usePermission('CUSTOMERS', 'canView');
  const queryClient = useQueryClient();

  // Every filter lives in the query string rather than component state, so a refresh, a bookmark,
  // or a shared link all reproduce the same view ("md files/Enquiry/UIen.md" §UX Improvements —
  // "Preserve filter state after refresh"), and browser Back steps through filter changes.
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (searchParams.get('status') ?? '') as EnquiryStatus | '';
  const appointmentStatus = (searchParams.get('apptStatus') ?? '') as AppointmentStatus | '';
  const customerId = searchParams.get('customer') ?? '';
  // Dashboard cards are single-select: `view` holds at most one group, and clicking a different
  // card replaces it rather than adding to it — only the most recently clicked card's filter
  // should ever be reflected in the URL.
  const viewParam = searchParams.get('view');
  const statusGroups = viewParam && STATUS_GROUP_KEYS.has(viewParam) ? [viewParam as EnquiryStatusGroup] : [];
  const quickFilter = toDateRangePreset(searchParams.get('quick'), QUICK_FILTERS);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;

  // A named window from the Date Range dropdown and explicit Event From/To are two ways of setting
  // the same range: the named window wins while it's selected (and its dates show in the date
  // fields), and editing a date field drops it back to "Custom Range".
  const quickRange = quickFilter ? dateRangeBounds(quickFilter) : null;
  const eventDateFrom = quickRange ? quickRange.from : parseParamDate(searchParams.get('eventFrom'));
  const eventDateTo = quickRange ? quickRange.to : parseParamDate(searchParams.get('eventTo'));
  const appointmentDateFrom = parseParamDate(searchParams.get('apptFrom'));
  const appointmentDateTo = parseParamDate(searchParams.get('apptTo'));

  // Event dates now sit in the main row, so all that is left behind the Advanced Filters reveal is
  // the appointment range — and that is what its badge counts.
  const appointmentFilterCount = [searchParams.get('apptFrom'), searchParams.get('apptTo')].filter(Boolean).length;

  // The dropdown shows the named window while one is selected, and reads "Custom Range" whenever
  // an explicit Event From/To is what's narrowing the list instead.
  const dateRangeValue: DateRangeValue = quickFilter ?? (eventDateFrom || eventDateTo ? CUSTOM_DATE_RANGE : '');

  const [advancedOpen, setAdvancedOpen] = useState(appointmentFilterCount > 0);
  const [deletingEnquiry, setDeletingEnquiry] = useState<EnquiryListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | undefined>(
    () => (location.state as { highlightId?: string } | null)?.highlightId,
  );

  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(undefined), 2500);
    return () => clearTimeout(timer);
  }, [highlightId]);

  // Any filter change sends the user back to page 1 — staying on page 7 of a result set that just
  // shrank to 2 pages would show an empty table. `page`/`limit` patches opt out of that reset.
  function patchParams(patch: Record<string, string | null>) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.entries(patch).forEach(([key, value]) => {
          if (value === null || value === '') next.delete(key);
          else next.set(key, value);
        });
        if (!('page' in patch)) next.delete('page');
        return next;
      },
      { replace: true },
    );
  }

  // Narrows along with every active filter except `view` — each card defines its own status
  // group, so folding the currently-selected card's group back into its own count would be
  // circular, and would silently zero out the other three cards whenever one was active.
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [
      'enquiries',
      'stats',
      {
        status,
        appointmentStatus,
        customerId,
        eventDateFrom: eventDateFrom?.format('YYYY-MM-DD'),
        eventDateTo: eventDateTo?.format('YYYY-MM-DD'),
        appointmentDateFrom: appointmentDateFrom?.format('YYYY-MM-DD'),
        appointmentDateTo: appointmentDateTo?.format('YYYY-MM-DD'),
      },
    ],
    queryFn: () =>
      enquiryService.getStats({
        status: status || undefined,
        appointmentStatus: appointmentStatus || undefined,
        customerId: customerId || undefined,
        eventDateFrom: eventDateFrom ? eventDateFrom.format('YYYY-MM-DD') : undefined,
        eventDateTo: eventDateTo ? eventDateTo.format('YYYY-MM-DD') : undefined,
        appointmentDateFrom: appointmentDateFrom ? appointmentDateFrom.format('YYYY-MM-DD') : undefined,
        appointmentDateTo: appointmentDateTo ? appointmentDateTo.format('YYYY-MM-DD') : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // Unlike Orders and Payment Tracker, which hold the chosen customer in component state, this
  // page keeps its filters in the URL — so a bookmarked ?customer=<id> arrives with only an id and
  // no name for the type-ahead to display. The customer is fetched by that id to fill it in.
  const { data: selectedCustomer } = useQuery({
    queryKey: ['customers', 'detail', customerId],
    queryFn: () => customerService.getById(customerId),
    enabled: canViewCustomers && Boolean(customerId),
  });

  const customer: CustomerOption | null = customerId ? (selectedCustomer ?? null) : null;

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [
      'enquiries',
      {
        page,
        limit,
        status,
        appointmentStatus,
        statusGroups,
        customerId,
        eventDateFrom: eventDateFrom?.format('YYYY-MM-DD'),
        eventDateTo: eventDateTo?.format('YYYY-MM-DD'),
        appointmentDateFrom: appointmentDateFrom?.format('YYYY-MM-DD'),
        appointmentDateTo: appointmentDateTo?.format('YYYY-MM-DD'),
      },
    ],
    queryFn: () =>
      enquiryService.list({
        page,
        limit,
        status: status || undefined,
        appointmentStatus: appointmentStatus || undefined,
        statusGroup: statusGroups.length ? statusGroups.join(',') : undefined,
        customerId: customerId || undefined,
        eventDateFrom: eventDateFrom ? eventDateFrom.format('YYYY-MM-DD') : undefined,
        eventDateTo: eventDateTo ? eventDateTo.format('YYYY-MM-DD') : undefined,
        appointmentDateFrom: appointmentDateFrom ? appointmentDateFrom.format('YYYY-MM-DD') : undefined,
        appointmentDateTo: appointmentDateTo ? appointmentDateTo.format('YYYY-MM-DD') : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  // Deleting an enquiry takes its quotations and its order with it, so the caches those modules
  // read from are invalidated alongside the enquiry list and its dashboard counts.
  const deleteMutation = useMutation({
    mutationFn: (id: string) => enquiryService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payment-trackers'] });
      setDeletingEnquiry(null);
      setDeleteError(null);
    },
    onError: (error) => {
      setDeleteError(
        isAxiosError<ApiErrorResponse>(error) && error.response
          ? error.response.data.message
          : 'Unable to delete this enquiry. Please try again.',
      );
    },
  });

  function resetFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  // Replaces whichever dashboard card was active with this one — only the last-clicked card's
  // filter is ever kept in the URL; clicking the already-active card clears it.
  function toggleStatusGroupCard(value: EnquiryStatusGroup) {
    patchParams({ view: statusGroups.includes(value) ? null : value });
  }

  function applyDateRange(value: DateRangeValue) {
    // "Custom Range" computes no window of its own — it hands the range straight back to the Event
    // From/To fields beside it, keeping whichever bounds are already on screen.
    if (value === CUSTOM_DATE_RANGE) {
      patchParams({
        quick: null,
        eventFrom: formatParamDate(eventDateFrom),
        eventTo: formatParamDate(eventDateTo),
      });
      return;
    }
    // A named window replaces any explicit event-date range, so the two can't disagree.
    patchParams({ quick: value || null, eventFrom: null, eventTo: null });
  }

  // Everything currently narrowing the list, as individually removable chips — so an unexpected
  // result count always has a visible cause, and one filter can be dropped without a full reset.
  const activeFilters: ActiveFilterChip[] = [];
  if (appointmentStatus) {
    activeFilters.push({
      key: 'apptStatus',
      label: `Appointment: ${resolveStatusConfig('appointment', appointmentStatus).label}`,
      onClear: () => patchParams({ apptStatus: null }),
    });
  }
  if (status) {
    activeFilters.push({
      key: 'status',
      label: `Status: ${resolveStatusConfig('enquiry', status).label}`,
      onClear: () => patchParams({ status: null }),
    });
  }
  if (statusGroups.length > 0) {
    const statusGroupLabel: Record<EnquiryStatusGroup, string> = {
      ACTIVE: 'Total Enquiries (excl. Order Lost)',
      CONFIRMED: 'Confirmed Enquiries',
      PENDING: 'Pending Enquiries',
      APPOINTMENT_PENDING: 'Appointment Pending',
    };
    for (const group of statusGroups) {
      activeFilters.push({
        key: `view-${group}`,
        label: statusGroupLabel[group],
        onClear: () => {
          const next = statusGroups.filter((g) => g !== group);
          patchParams({ view: next.length ? next.join(',') : null });
        },
      });
    }
  }
  if (customerId) {
    activeFilters.push({
      key: 'customer',
      label: `Customer: ${customer?.customerName ?? 'Selected customer'}`,
      onClear: () => patchParams({ customer: null }),
    });
  }
  if (quickFilter) {
    activeFilters.push({
      key: 'quick',
      label: DATE_RANGE_LABELS[quickFilter],
      onClear: () => patchParams({ quick: null }),
    });
  } else if (eventDateFrom || eventDateTo) {
    activeFilters.push({
      key: 'eventRange',
      label: `Event ${eventDateFrom ? formatDate(eventDateFrom.toISOString()) : '…'} – ${
        eventDateTo ? formatDate(eventDateTo.toISOString()) : '…'
      }`,
      onClear: () => patchParams({ eventFrom: null, eventTo: null }),
    });
  }
  if (appointmentDateFrom || appointmentDateTo) {
    activeFilters.push({
      key: 'apptRange',
      label: `Appointment ${appointmentDateFrom ? formatDate(appointmentDateFrom.toISOString()) : '…'} – ${
        appointmentDateTo ? formatDate(appointmentDateTo.toISOString()) : '…'
      }`,
      onClear: () => patchParams({ apptFrom: null, apptTo: null }),
    });
  }

  const columns: DataTableColumn<EnquiryListItem>[] = [
    {
      key: 'enquiryNumber',
      header: 'Enquiry',
      sortable: true,
      align: 'center' as const,
      width: 165,
      // The number is the row's link to its detail page — a real anchor, so it also supports
      // middle-click and ctrl-click to open in a new tab.
      render: (row) => (
        <div className="tw-min-w-0">
          <Link
            to={`/enquiries/${row.id}`}
            className="tw-block tw-truncate tw-font-bold tw-tabular-nums tw-text-brand tw-no-underline hover:tw-underline"
          >
            {row.enquiryNumber}
          </Link>
          <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
            Created {formatDate(row.createdAt)}
          </div>
        </div>
      ),
      exportValue: (row) => row.enquiryNumber,
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      align: 'center' as const,
      width: 150,
      render: (row) => (
        <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-center tw-gap-2">
          <InitialsAvatar name={row.customer.customerName || '?'} seed={row.customer.customerName || row.customer.mobile} />
          <div className="tw-min-w-0">
            <div className="tw-truncate tw-font-semibold tw-leading-tight">{row.customer.customerName || '—'}</div>
            <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
              {row.customer.mobile || 'No mobile'}
            </div>
          </div>
        </div>
      ),
      exportValue: (row) => `${row.customer.customerName} (${row.customer.mobile})`,
    },
    {
      key: 'eventType',
      header: 'Event',
      align: 'center' as const,
      width: 105,
      render: (row) => (
        <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-center tw-gap-2">
          <span
            aria-hidden
            className="tw-h-2 tw-w-2 tw-shrink-0 tw-rounded-full"
            style={{ backgroundColor: row.eventType.colorCode ?? '#2563EB' }}
          />
          <div className="tw-min-w-0">
            <div className="tw-truncate tw-font-semibold tw-leading-tight">{row.eventType.eventName}</div>
            {row.eventName && (
              <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
                {row.eventName}
              </div>
            )}
          </div>
        </div>
      ),
      exportValue: (row) => `${row.eventType.eventName}${row.eventName ? ` – ${row.eventName}` : ''}`,
    },
    {
      key: 'eventDate',
      header: 'Event Date',
      align: 'center' as const,
      width: 125,
      render: (row) => {
        if (!row.eventDate) {
          return <span className="tw-text-ink-muted dark:tw-text-ink-dark-muted">Not set</span>;
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
      key: 'appointmentDate',
      header: 'Appointment',
      align: 'center' as const,
      width: 120,
      render: (row) =>
        row.appointmentDate ? (
          <div className="tw-min-w-0">
            <div className="tw-truncate tw-font-semibold">{formatDate(row.appointmentDate)}</div>
            <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
              {row.appointmentTime ?? 'Time not set'}
            </div>
          </div>
        ) : (
          <span className="tw-text-ink-muted dark:tw-text-ink-dark-muted">Not scheduled</span>
        ),
      exportValue: (row) =>
        row.appointmentDate ? `${formatDate(row.appointmentDate)}${row.appointmentTime ? ` ${row.appointmentTime}` : ''}` : '',
    },
    {
      key: 'assignedUser',
      header: 'Assigned To',
      align: 'center' as const,
      width: 125,
      render: (row) =>
        row.assignedUser ? (
          <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-center tw-gap-1.5">
            <InitialsAvatar name={row.assignedUser.fullName} seed={row.assignedUser.fullName} size="sm" />
            <span className="tw-truncate">{row.assignedUser.fullName}</span>
          </div>
        ) : (
          <span className="tw-text-ink-muted dark:tw-text-ink-dark-muted">Unassigned</span>
        ),
      exportValue: (row) => row.assignedUser?.fullName ?? '',
    },
    {
      key: 'appointmentStatus',
      header: 'Appt. Status',
      align: 'center' as const,
      width: 115,
      render: (row) => <StatusBadge type="appointment" status={row.appointmentStatus} size="md" />,
      exportValue: (row) => row.appointmentStatus,
    },
    {
      key: 'status',
      header: 'Enquiry Status',
      align: 'center' as const,
      width: 155,
      render: (row) => <StatusBadge type="enquiry" status={row.status} size="md" />,
      exportValue: (row) => row.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center' as const,
      width: 110,
      // View, Edit and Delete, each one click. Edit and Delete are hidden without their permission,
      // so a viewer sees View alone. Clicks stop propagation so they don't also fire the row's own
      // onClick and navigate away underneath the dialog.
      render: (row) => (
        <div className="tw-flex tw-justify-center tw-gap-0.5">
          <IconButton
            title="View enquiry"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/enquiries/${row.id}`);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {canEdit && (
            <IconButton
              title="Edit enquiry"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/enquiries/${row.id}/edit`);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {canDelete && (
            <IconButton
              title="Delete enquiry"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setDeleteError(null);
                setDeletingEnquiry(row);
              }}
            >
              <DeleteIcon fontSize="small" className="tw-text-danger" />
            </IconButton>
          )}
        </div>
      ),
    } satisfies DataTableColumn<EnquiryListItem>,
  ];

  const totalRecords = data?.meta?.totalRecords;

  return (
    <div>
      {/* Compact page header — breadcrumb trail, title with its record-count pill, and the
          actions on one tight band so the filters and table below get the screen room. */}
      <section className="tw-relative tw-mb-4 tw-overflow-hidden tw-rounded-card tw-border tw-border-hairline tw-bg-white tw-px-4 tw-py-3 tw-shadow-card dark:tw-border-hairline-dark dark:tw-bg-surface-dark sm:tw-px-5">
        <div
          aria-hidden
          className="tw-pointer-events-none tw-absolute -tw-right-20 -tw-top-24 tw-h-60 tw-w-60 tw-rounded-full tw-bg-gradient-to-br tw-from-brand/15 tw-to-cyan-400/10 tw-blur-2xl"
        />

        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Enquiries' }]} className="tw-mb-1.5" />

        <div className="tw-relative tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-4 tw-gap-y-2">
          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1.5">
            <h1 className="tw-m-0 tw-text-2xl tw-font-bold tw-leading-tight tw-tracking-tight tw-text-ink dark:tw-text-ink-dark">
              Enquiries
            </h1>
            {totalRecords !== undefined && (
              <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-brand/20 tw-bg-brand/10 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-tabular-nums tw-text-brand dark:tw-border-brand-light/30 dark:tw-bg-brand-light/15 dark:tw-text-brand-light">
                {totalRecords} {totalRecords === 1 ? 'record' : 'records'}
              </span>
            )}
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2.5">
            <LastUpdated timestamp={dataUpdatedAt} refreshing={isFetching} onRefresh={() => void refetch()} />
            {canCreate && (
              <Button
                variant="primary"
                size="md"
                className="tw-h-10 tw-px-5 tw-shadow-md"
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => navigate('/enquiries/new')}
              >
                New Enquiry
              </Button>
            )}
          </div>
        </div>

        <hr className="tw-mt-3 tw-border-b tw-border-hairline dark:tw-border-hairline-dark" />

        {/* Filter toolbar, integrated into the page header so it reads as one chrome band with
            the title rather than a separate card eating vertical space above the table. */}
        <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2.5">
          {/* Filters in the order the list is actually read: pick the event window first, then
              narrow by where the enquiry stands, then by who it is for. Everything runs at the
              standard 40px filter height so the date pickers sit level with the dropdowns, and each
              control keeps its label block above the box so the row bottom-aligns. */}
          <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-2.5">
            <DateRangeFilter
              className={FILTER_FIELD_WIDTH}
              label="Event Date Range"
              presets={QUICK_FILTERS}
              value={dateRangeValue}
              onChange={applyDateRange}
              custom
            />

            <SelectField
              className={FILTER_FIELD_WIDTH}
              label="Enquiry Status"
              emptyLabel="All"
              value={status}
              onChange={(value) => patchParams({ status: value || null })}
              options={ENQUIRY_STATUS_OPTIONS.map((option) => ({
                value: option,
                label: resolveStatusConfig('enquiry', option).label,
              }))}
            />

            {/* The two bounds of the window the dropdown names — editing either is what "Custom
                Range" means, so both handlers drop the named window. */}
            <div className="tw-flex-1 tw-basis-[145px]">
              <DatePickerField
                label="Event From"
                margin="none"
                value={eventDateFrom}
                onChange={(value) =>
                  patchParams({ eventFrom: formatParamDate(value), eventTo: formatParamDate(eventDateTo), quick: null })
                }
              />
            </div>
            <div className="tw-flex-1 tw-basis-[145px]">
              <DatePickerField
                label="Event To"
                margin="none"
                value={eventDateTo}
                onChange={(value) =>
                  patchParams({ eventFrom: formatParamDate(eventDateFrom), eventTo: formatParamDate(value), quick: null })
                }
                minDate={eventDateFrom ?? undefined}
              />
            </div>

            <SelectField
              className={FILTER_FIELD_WIDTH}
              label="Appointment Status"
              emptyLabel="All"
              value={appointmentStatus}
              onChange={(value) => patchParams({ apptStatus: value || null })}
              options={APPOINTMENT_STATUS_OPTIONS.map((option) => ({
                value: option,
                label: resolveStatusConfig('appointment', option).label,
              }))}
            />

            {/* Its 40px height lines up with the Tailwind fields it sits beside; the wider basis
                gives customer names room the fixed-width dropdowns don't need. */}
            {canViewCustomers && (
              <CustomerFilter
                className="tw-w-full tw-flex-[2] sm:tw-basis-[240px]"
                value={customer}
                onChange={(next) => patchParams({ customer: next?.id ?? null })}
              />
            )}

            {/* Filters apply as they're changed, so the row needs no Apply button; clearing is
                handled by the active-filter chips below. */}
            <Button
              variant="ghost"
              className="tw-h-10"
              onClick={() => setAdvancedOpen((previous) => !previous)}
              startIcon={<TuneIcon fontSize="small" />}
              endIcon={
                <ExpandMoreIcon
                  fontSize="small"
                  className={`tw-transition-transform tw-duration-200 ${advancedOpen ? 'tw-rotate-180' : ''}`}
                />
              }
            >
              Advanced Filters{appointmentFilterCount > 0 ? ` (${appointmentFilterCount})` : ''}
            </Button>
          </div>

          {/* Advanced row: the appointment range, collapsed by default — the event range the list is
              usually read by now sits in the main row above. The 0fr→1fr grid track animates the
              reveal without needing a measured pixel height. Collapsed it still has zero height but
              is still a flex child, so the column's gap would leave a dead band behind it — the
              negative margin cancels exactly that one gap while the panel is shut. */}
          <div
            className={`tw-grid tw-transition-all tw-duration-200 ${
              advancedOpen ? 'tw-grid-rows-[1fr] tw-opacity-100' : '-tw-mt-2.5 tw-grid-rows-[0fr] tw-opacity-0'
            }`}
          >
            <div className="tw-overflow-hidden">
              <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-3 tw-pt-0.5">
                <div className="tw-flex tw-flex-1 tw-basis-[320px] tw-gap-2">
                  <div className="tw-flex-1">
                    <DatePickerField
                      label="Appointment From"
                      margin="none"
                      value={appointmentDateFrom}
                      onChange={(value) => patchParams({ apptFrom: formatParamDate(value) })}
                    />
                  </div>
                  <div className="tw-flex-1">
                    <DatePickerField
                      label="Appointment To"
                      margin="none"
                      value={appointmentDateTo}
                      onChange={(value) => patchParams({ apptTo: formatParamDate(value) })}
                      minDate={appointmentDateFrom ?? undefined}
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
                    className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-brand/15 tw-bg-brand/[0.06] tw-py-1 tw-pl-3 tw-pr-1 tw-text-xs tw-font-medium tw-text-ink dark:tw-border-brand-light/20 dark:tw-bg-brand-light/10 dark:tw-text-ink-dark"
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
      </section>

      {/* Pipeline summary tiles — each is also a one-click filter: click to apply the group, click
          again to clear it. The subtext states what each count means so the cards read at a glance. */}
      <div className="tw-mb-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
        <StatCard
          label="Total Enquiries"
          value={stats?.totalEnquiries ?? 0}
          icon={<ListAltIcon />}
          tone="blue"
          subtext="Active pipeline, excluding lost"
          loading={statsLoading}
          onClick={() => toggleStatusGroupCard('ACTIVE')}
          selected={statusGroups.includes('ACTIVE')}
        />
        <StatCard
          label="Confirmed Enquiries"
          value={stats?.confirmedEnquiries ?? 0}
          icon={<CheckCircleIcon />}
          tone="green"
          subtext="Converted to orders"
          loading={statsLoading}
          onClick={() => toggleStatusGroupCard('CONFIRMED')}
          selected={statusGroups.includes('CONFIRMED')}
        />
        <StatCard
          label="Pending Enquiries"
          value={stats?.pendingEnquiries ?? 0}
          icon={<HourglassTopIcon />}
          tone="amber"
          subtext="Awaiting confirmation"
          loading={statsLoading}
          onClick={() => toggleStatusGroupCard('PENDING')}
          selected={statusGroups.includes('PENDING')}
        />
        <StatCard
          label="Appointment Pending"
          value={stats?.appointmentPending ?? 0}
          icon={<PendingActionsIcon />}
          tone="violet"
          subtext="Awaiting appointment"
          loading={statsLoading}
          onClick={() => toggleStatusGroupCard('APPOINTMENT_PENDING')}
          selected={statusGroups.includes('APPOINTMENT_PENDING')}
        />
      </div>

      <DataTable
        columns={columns}
        rows={data?.records ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        meta={data?.meta}
        page={page}
        limit={limit}
        fixedLayout
        stickyHeader
        headerTone="tint"
        maxHeight="calc(100vh - 230px)"
        onRefresh={() => void refetch()}
        refreshing={isFetching}
        rowAccentColor={(row) => ENQUIRY_ROW_ACCENT[row.status]}
        onPageChange={(nextPage) => patchParams({ page: String(nextPage) })}
        onLimitChange={(newLimit) => patchParams({ limit: String(newLimit) })}
        onRowClick={(row) => navigate(`/enquiries/${row.id}`)}
        emptyState={{
          icon: <ListAltIcon sx={{ fontSize: 36 }} />,
          title: activeFilters.length > 0 ? 'No enquiries match these filters' : 'Your Enquiry List is Waiting',
          description:
            activeFilters.length > 0
              ? 'Try widening the date range or clearing a filter.'
              : canCreate
                ? 'No enquiries yet. Create your first enquiry to get started.'
                : 'No enquiries found.',
          action:
            activeFilters.length > 0 ? (
              <Button onClick={resetFilters}>Reset Filters</Button>
            ) : canCreate ? (
              <Button variant="primary" startIcon={<AddIcon fontSize="small" />} onClick={() => navigate('/enquiries/new')}>
                New Enquiry
              </Button>
            ) : undefined,
        }}
        exportFileName="enquiries"
        canExport={canExport}
        highlightRowId={highlightId}
      />

      {!canCreate && (
        <p className="tw-mt-2 tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
          You have view-only access to Enquiries.
        </p>
      )}

      {/* Spells out the cascade before it happens — an enquiry that became an order takes far more
          with it than the row the user clicked, and that has to be visible at the point of no return. */}
      <ConfirmDialog
        open={Boolean(deletingEnquiry)}
        title="Delete Enquiry?"
        message={
          <>
            Delete enquiry &quot;{deletingEnquiry?.enquiryNumber}&quot; for{' '}
            {deletingEnquiry?.customer.customerName || 'this customer'}? Its quotations and any order
            raised from it — including that order&apos;s payments, invoice, payment tracker, task plan
            and documents — are deleted as well.
            {deleteError && <span className="tw-mt-2 tw-block tw-text-danger">{deleteError}</span>}
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deletingEnquiry && deleteMutation.mutate(deletingEnquiry.id)}
        onClose={() => {
          setDeletingEnquiry(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
