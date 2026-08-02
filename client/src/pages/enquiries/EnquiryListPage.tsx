import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SendIcon from '@mui/icons-material/Send';
import TodayIcon from '@mui/icons-material/Today';
import TuneIcon from '@mui/icons-material/Tune';
import UpdateIcon from '@mui/icons-material/Update';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DatePickerField } from '../../components/DatePickerField';
import { LastUpdated } from '../../components/LastUpdated';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatCard } from '../../components/StatCard';
import { resolveStatusConfig } from '../../components/statusConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { CARD_SURFACE } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';
import { SelectField } from '../../components/ui/Select';
import { usePermission } from '../../hooks/usePermission';
import * as enquiryService from '../../services/enquiryService';
import * as eventTypeService from '../../services/eventTypeService';
import * as userService from '../../services/userService';
import type { AppointmentStatus, EnquiryListItem, EnquiryStatus } from '../../types/enquiry';
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
  PENDING: '#06B6D4',
  APPOINTMENT_FIXED: '#8B5CF6',
  QUOTATION_TO_SHARE: '#F59E0B',
  QUOTATION_SHARED: '#3B82F6',
  ORDER_CONFIRMED: '#22C55E',
  ORDER_LOST: '#EF4444',
};

// "md files/Enquiry/UI1.md" §Quick Filters — one-click date ranges over the event date.
type QuickFilter = 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'THIS_MONTH' | 'UPCOMING';

// Each range carries its own icon rather than all five repeating one generic calendar — an icon
// that's identical across every pill carries no information and just adds visual noise.
const QUICK_FILTERS: { key: QuickFilter; label: string; icon: ReactNode }[] = [
  { key: 'TODAY', label: 'Today', icon: <TodayIcon fontSize="small" /> },
  { key: 'TOMORROW', label: 'Tomorrow', icon: <UpdateIcon fontSize="small" /> },
  { key: 'THIS_WEEK', label: 'This Week', icon: <DateRangeIcon fontSize="small" /> },
  { key: 'THIS_MONTH', label: 'This Month', icon: <CalendarMonthIcon fontSize="small" /> },
  { key: 'UPCOMING', label: 'Upcoming', icon: <ScheduleIcon fontSize="small" /> },
];

const QUICK_FILTER_KEYS = new Set<string>(QUICK_FILTERS.map((filter) => filter.key));

// Filter controls grow to share whatever width the search bar leaves, rather than sitting at a
// fixed size and stranding empty space at the row's right edge. The basis is the width they settle
// at once the row is full enough to wrap.
const FILTER_FIELD_WIDTH = 'tw-w-full tw-flex-1 sm:tw-basis-[170px]';

// `to: null` means open-ended (Upcoming = everything from today onwards).
function quickFilterRange(key: QuickFilter): { from: Dayjs; to: Dayjs | null } {
  const today = dayjs();
  switch (key) {
    case 'TODAY':
      return { from: today, to: today };
    case 'TOMORROW':
      return { from: today.add(1, 'day'), to: today.add(1, 'day') };
    case 'THIS_WEEK':
      return { from: today.startOf('week'), to: today.endOf('week') };
    case 'THIS_MONTH':
      return { from: today.startOf('month'), to: today.endOf('month') };
    case 'UPCOMING':
      return { from: today, to: null };
  }
}

function parseParamDate(value: string | null): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : null;
}

function formatParamDate(value: Dayjs | null): string | null {
  return value ? value.format('YYYY-MM-DD') : null;
}

interface ActiveFilterChip {
  key: string;
  label: string;
  onClear: () => void;
}

// Rounded rectangles rather than fully-round pills, sized to sit comfortably against the
// toolbar's inputs ("md files/Enquiry/UIen.md" §Quick Filters — rounded pills, hover effect).
function QuickFilterPill({
  label,
  active,
  icon,
  onClick,
}: {
  label: string;
  active: boolean;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'tw-inline-flex tw-h-8 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-control tw-border tw-px-2.5',
        'tw-font-sans tw-text-xs tw-font-semibold',
        'tw-transition-all tw-duration-200 hover:-tw-translate-y-px',
        'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-brand/40',
        active
          ? 'tw-border-transparent tw-bg-brand tw-text-white'
          : 'tw-border-hairline tw-bg-white tw-text-ink hover:tw-border-slate-300 dark:tw-border-hairline-dark dark:tw-bg-surface-dark dark:tw-text-ink-dark dark:hover:tw-border-slate-500',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}

export default function EnquiryListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canCreate = usePermission('ENQUIRIES', 'canCreate');
  const canExport = usePermission('ENQUIRIES', 'canExport');
  const canEdit = usePermission('ENQUIRIES', 'canEdit');

  // Every filter lives in the query string rather than component state, so a refresh, a bookmark,
  // or a shared link all reproduce the same view ("md files/Enquiry/UIen.md" §UX Improvements —
  // "Preserve filter state after refresh"), and browser Back steps through filter changes.
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const status = (searchParams.get('status') ?? '') as EnquiryStatus | '';
  const appointmentStatus = (searchParams.get('apptStatus') ?? '') as AppointmentStatus | '';
  const assignedUserId = searchParams.get('user') ?? '';
  const eventTypeId = searchParams.get('eventType') ?? '';
  const quickParam = searchParams.get('quick');
  const quickFilter = quickParam && QUICK_FILTER_KEYS.has(quickParam) ? (quickParam as QuickFilter) : null;
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 10;

  // A quick-filter pill and explicit Event From/To are two ways of setting the same range: the pill
  // wins while it's active (and its dates show in the date fields), and editing a date field drops
  // the pill.
  const quickRange = quickFilter ? quickFilterRange(quickFilter) : null;
  const eventDateFrom = quickRange ? quickRange.from : parseParamDate(searchParams.get('eventFrom'));
  const eventDateTo = quickRange ? quickRange.to : parseParamDate(searchParams.get('eventTo'));
  const appointmentDateFrom = parseParamDate(searchParams.get('apptFrom'));
  const appointmentDateTo = parseParamDate(searchParams.get('apptTo'));

  const dateFilterCount = [
    searchParams.get('eventFrom'),
    searchParams.get('eventTo'),
    searchParams.get('apptFrom'),
    searchParams.get('apptTo'),
  ].filter(Boolean).length;

  // "All" stays lit only while nothing at all narrows the event date — a pill range or an explicit
  // From/To both take it off.
  const hasDateFilter = Boolean(quickFilter || eventDateFrom || eventDateTo);

  const [advancedOpen, setAdvancedOpen] = useState(dateFilterCount > 0);
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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['enquiries', 'stats'],
    queryFn: () => enquiryService.getStats(),
  });

  const { data: eventTypeOptions } = useQuery({
    queryKey: ['event-types', 'active'],
    queryFn: () => eventTypeService.listActive(),
  });

  const { data: userOptions } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => userService.listActive(),
  });

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [
      'enquiries',
      {
        page,
        limit,
        search,
        status,
        appointmentStatus,
        eventTypeId,
        assignedUserId,
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
        search: search || undefined,
        status: status || undefined,
        appointmentStatus: appointmentStatus || undefined,
        eventTypeId: eventTypeId || undefined,
        assignedUserId: assignedUserId || undefined,
        eventDateFrom: eventDateFrom ? eventDateFrom.format('YYYY-MM-DD') : undefined,
        eventDateTo: eventDateTo ? eventDateTo.format('YYYY-MM-DD') : undefined,
        appointmentDateFrom: appointmentDateFrom ? appointmentDateFrom.format('YYYY-MM-DD') : undefined,
        appointmentDateTo: appointmentDateTo ? appointmentDateTo.format('YYYY-MM-DD') : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  function resetFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  function toggleAppointmentStatusCard(value: AppointmentStatus) {
    patchParams({ apptStatus: appointmentStatus === value ? null : value });
  }

  function toggleEnquiryStatusCard(value: EnquiryStatus) {
    patchParams({ status: status === value ? null : value });
  }

  function applyQuickFilter(key: QuickFilter | null) {
    // The pill replaces any explicit event-date range, so both can't disagree.
    patchParams({ quick: key === quickFilter ? null : key, eventFrom: null, eventTo: null });
  }

  // Everything currently narrowing the list, as individually removable chips — so an unexpected
  // result count always has a visible cause, and one filter can be dropped without a full reset.
  const activeFilters: ActiveFilterChip[] = [];
  if (search) {
    activeFilters.push({ key: 'q', label: `Search: "${search}"`, onClear: () => patchParams({ q: null }) });
  }
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
  if (assignedUserId) {
    const assignedUser = userOptions?.find((option) => option.id === assignedUserId);
    activeFilters.push({
      key: 'user',
      label: `Assigned: ${assignedUser?.fullName ?? 'Selected user'}`,
      onClear: () => patchParams({ user: null }),
    });
  }
  if (eventTypeId) {
    const eventType = eventTypeOptions?.find((option) => option.id === eventTypeId);
    activeFilters.push({
      key: 'eventType',
      label: `Event: ${eventType?.eventName ?? 'Selected type'}`,
      onClear: () => patchParams({ eventType: null }),
    });
  }
  if (quickFilter) {
    activeFilters.push({
      key: 'quick',
      label: QUICK_FILTERS.find((filter) => filter.key === quickFilter)!.label,
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
      width: 135,
      render: (row) => (
        <div className="tw-min-w-0">
          <div className="tw-truncate tw-font-semibold tw-leading-tight">{row.customer.customerName || '—'}</div>
          <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
            {row.customer.mobile || 'No mobile'}
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
          <div className="tw-truncate">{row.assignedUser.fullName}</div>
        ) : (
          <span className="tw-text-ink-muted dark:tw-text-ink-dark-muted">Unassigned</span>
        ),
      exportValue: (row) => row.assignedUser?.fullName ?? '',
    },
    {
      key: 'appointmentStatus',
      header: 'Appt. Status',
      align: 'center' as const,
      width: 105,
      render: (row) => <StatusBadge type="appointment" status={row.appointmentStatus} size="sm" />,
      exportValue: (row) => row.appointmentStatus,
    },
    {
      key: 'status',
      header: 'Enquiry Status',
      align: 'center' as const,
      width: 150,
      render: (row) => <StatusBadge type="enquiry" status={row.status} size="sm" />,
      exportValue: (row) => row.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center' as const,
      width: 95,
      // View and Edit only. Edit is hidden rather than disabled for a viewer — a control that can
      // never do anything is noise in a column this narrow.
      render: (row) => (
        <div className="tw-flex tw-justify-center tw-gap-0.5">
          <IconButton title="View enquiry" size="sm" onClick={() => navigate(`/enquiries/${row.id}`)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {canEdit && (
            <IconButton title="Edit enquiry" size="sm" onClick={() => navigate(`/enquiries/${row.id}/edit`)}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
        </div>
      ),
    } satisfies DataTableColumn<EnquiryListItem>,
  ];

  const totalRecords = data?.meta?.totalRecords;

  return (
    <div>
      <PageHeader
        title="Enquiries"
        subtitle="Manage all customer enquiries and appointments."
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Enquiries' }]}
        titleAdornment={
          totalRecords === undefined ? undefined : (
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-slate-100 tw-px-2.5 tw-py-0.5 tw-text-[0.6875rem] tw-font-semibold tw-text-ink-muted dark:tw-bg-slate-700 dark:tw-text-ink-dark-muted">
              {totalRecords} {totalRecords === 1 ? 'record' : 'records'}
            </span>
          )
        }
        actions={
          <>
            <LastUpdated timestamp={dataUpdatedAt} refreshing={isFetching} onRefresh={() => void refetch()} />
            {canCreate && (
              <Button variant="primary" startIcon={<AddIcon fontSize="small" />} onClick={() => navigate('/enquiries/new')}>
                New Enquiry
              </Button>
            )}
          </>
        }
      />

      {/* Dashboard summary metrics as StatCard tiles, matching the Orders index. Each is also a
          one-click filter ("md files/Enquiry/indexUI.md" §Card Behaviour: click applies the filter,
          click again clears it). */}
      <div className="tw-mb-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
        <StatCard
          label="Pending Appointments"
          value={stats?.pendingAppointments ?? 0}
          icon={<PendingActionsIcon />}
          tone="amber"
          loading={statsLoading}
          onClick={() => toggleAppointmentStatusCard('PENDING')}
          selected={appointmentStatus === 'PENDING'}
        />
        <StatCard
          label="In Progress"
          value={stats?.inProgressAppointments ?? 0}
          icon={<HourglassTopIcon />}
          tone="orange"
          loading={statsLoading}
          onClick={() => toggleAppointmentStatusCard('IN_PROGRESS')}
          selected={appointmentStatus === 'IN_PROGRESS'}
        />
        <StatCard
          label="Quotation To Share"
          value={stats?.quotationToShare ?? 0}
          icon={<RequestQuoteIcon />}
          tone="yellow"
          loading={statsLoading}
          onClick={() => toggleEnquiryStatusCard('QUOTATION_TO_SHARE')}
          selected={status === 'QUOTATION_TO_SHARE'}
        />
        <StatCard
          label="Quotation Shared"
          value={stats?.quotationShared ?? 0}
          icon={<SendIcon />}
          tone="blue"
          loading={statsLoading}
          onClick={() => toggleEnquiryStatusCard('QUOTATION_SHARED')}
          selected={status === 'QUOTATION_SHARED'}
        />
      </div>

      <div className={`${CARD_SURFACE} tw-mb-4 tw-flex tw-flex-col tw-gap-2.5 tw-px-3 tw-py-2.5`}>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <QuickFilterPill label="All" active={!hasDateFilter} onClick={() => applyQuickFilter(null)} />
          {QUICK_FILTERS.map((filter) => (
            <QuickFilterPill
              key={filter.key}
              label={filter.label}
              active={quickFilter === filter.key}
              icon={filter.icon}
              onClick={() => applyQuickFilter(filter.key)}
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
              onChange={(value) => patchParams({ q: value || null })}
              onSubmit={() => void refetch()}
              placeholder="Search enquiry no, customer, mobile, event..."
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

          <SelectField
            className={FILTER_FIELD_WIDTH}
            label="Assigned User"
            emptyLabel="All"
            value={assignedUserId}
            onChange={(value) => patchParams({ user: value || null })}
            options={(userOptions ?? []).map((option) => ({ value: option.id, label: option.fullName }))}
          />

          <SelectField
            className={FILTER_FIELD_WIDTH}
            label="Event Type"
            emptyLabel="All"
            value={eventTypeId}
            onChange={(value) => patchParams({ eventType: value || null })}
            options={(eventTypeOptions ?? []).map((option) => ({ value: option.id, label: option.eventName }))}
          />

          {/* Filters apply as they're changed (UIen.md §UX Improvements — "Search updates results
              instantly (debounced)"), so the row needs no Apply button; clearing is handled by the
              active-filter chips below. That leaves the row's right edge for the date-range reveal. */}
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

        {/* Advanced row: date-range filters, collapsed by default. The 0fr→1fr grid track animates
            the reveal without needing a measured pixel height. Collapsed it still has zero height
            but is still a flex child, so the column's gap would leave a dead band behind it — the
            negative margin cancels exactly that one gap while the panel is shut. */}
        <div
          className={`tw-grid tw-transition-all tw-duration-200 ${
            advancedOpen ? 'tw-grid-rows-[1fr] tw-opacity-100' : '-tw-mt-2.5 tw-grid-rows-[0fr] tw-opacity-0'
          }`}
        >
          <div className="tw-overflow-hidden">
            {/* The two ranges stay visually paired, but each pair now spreads across the width the
                row actually has instead of stopping at a fixed 155px and leaving the rest blank. */}
            <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-2.5 tw-pt-0.5">
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

              <div className="tw-flex tw-flex-1 tw-basis-[320px] tw-gap-2">
                <div className="tw-flex-1">
                  <DatePickerField
                    label="Event From"
                    margin="none"
                    value={eventDateFrom}
                    onChange={(value) =>
                      patchParams({ eventFrom: formatParamDate(value), eventTo: formatParamDate(eventDateTo), quick: null })
                    }
                  />
                </div>
                <div className="tw-flex-1">
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
                  className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-hairline tw-bg-white tw-py-1 tw-pl-3 tw-pr-1 tw-text-xs tw-text-ink dark:tw-border-hairline-dark dark:tw-bg-surface-dark dark:tw-text-ink-dark"
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
        onRefresh={() => void refetch()}
        refreshing={isFetching}
        rowAccentColor={(row) => ENQUIRY_ROW_ACCENT[row.status]}
        onPageChange={(nextPage) => patchParams({ page: String(nextPage) })}
        onLimitChange={(newLimit) => patchParams({ limit: String(newLimit) })}
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

    </div>
  );
}
