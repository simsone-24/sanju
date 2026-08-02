import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PrintIcon from '@mui/icons-material/Print';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
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
import { Menu, MenuItem } from '../../components/ui/Menu';
import { SelectField } from '../../components/ui/Select';
import { usePermission } from '../../hooks/usePermission';
import * as customerService from '../../services/customerService';
import * as quotationService from '../../services/quotationService';
import * as userService from '../../services/userService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type { QuotationGroupedRow, QuotationSource, QuotationStatus } from '../../types/quotation';
import { formatCurrency, formatDate } from '../../utils/format';
import { QuotationPreviewDialog } from './QuotationPreviewDialog';
import { buildQuotationWhatsAppLink, canShareQuotation } from './quotationActions';
import { isQuotationEditable } from './quotationStatusTransitions';

const STATUS_OPTIONS: QuotationStatus[] = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'REVISED'];

const SOURCE_OPTIONS: { value: QuotationSource; label: string }[] = [
  { value: 'ENQUIRY', label: 'Enquiry' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'ORDER', label: 'Order' },
  { value: 'MANUAL', label: 'Manual' },
];

// Row-left accent stripe per quotation status, mirroring statusConfig.ts's semantic hues as
// literal values (DataTable's rowAccentColor callback runs outside a theme-aware sx function).
const QUOTATION_ROW_ACCENT: Record<QuotationStatus, string> = {
  DRAFT: '#94A3B8',
  SENT: '#06B6D4',
  APPROVED: '#22C55E',
  REJECTED: '#EF4444',
  REVISED: '#F59E0B',
};

// Filter controls grow to share whatever width the search bar leaves, rather than sitting at a
// fixed size and stranding empty space at the row's right edge. The basis is the width they settle
// at once the row is full enough to wrap.
const FILTER_FIELD_WIDTH = 'tw-w-full tw-flex-1 sm:tw-basis-[150px]';

interface PendingAction {
  id: string;
  quotationNumber: string;
  action: 'send' | 'reject';
}

const ACTION_COPY: Record<PendingAction['action'], { title: string; message: (num: string) => string; danger?: boolean }> = {
  send: {
    title: 'Send Quotation?',
    message: (num) => `Mark quotation "${num}" as sent to the customer?`,
  },
  reject: {
    title: 'Reject Quotation?',
    message: (num) => `Mark quotation "${num}" as rejected?`,
    danger: true,
  },
};

// A grouped row is either one enquiry (showing its latest revision) or a standalone
// Customer/Order/Manual quotation. Flattened here so the columns don't branch on `kind` repeatedly.
interface FlatRow {
  rowId: string;
  quotationId: string;
  quotationNumber: string;
  version: number;
  revisionCount: number;
  sourceLabel: string;
  enquiryNumber: string | null;
  enquiryId: string | null;
  customerName: string;
  phone: string | null;
  whatsapp: string | null;
  eventType: string | null;
  eventColor: string | null;
  eventName: string | null;
  eventDate: string | null;
  ownerName: string | null;
  totalAmount: string;
  status: QuotationStatus;
  quotationDate: string;
}

function flatten(row: QuotationGroupedRow): FlatRow {
  if (row.kind === 'ENQUIRY') {
    return {
      rowId: row.enquiry.id,
      quotationId: row.latestQuotation.id,
      quotationNumber: row.latestQuotation.quotationNumber,
      version: row.latestQuotation.version,
      revisionCount: row.quotationCount,
      sourceLabel: 'Enquiry',
      enquiryNumber: row.enquiry.enquiryNumber,
      enquiryId: row.enquiry.id,
      customerName: row.enquiry.customerName,
      phone: row.enquiry.customerMobile || null,
      whatsapp: null,
      eventType: row.enquiry.eventType,
      eventColor: row.enquiry.colorCode,
      eventName: row.enquiry.eventName,
      eventDate: row.enquiry.eventDate,
      ownerName: row.enquiry.assignedUser?.fullName ?? null,
      totalAmount: row.latestQuotation.totalAmount,
      status: row.latestQuotation.status,
      quotationDate: row.latestQuotation.quotationDate,
    };
  }
  const { quotation } = row;
  return {
    rowId: quotation.id,
    quotationId: quotation.id,
    quotationNumber: quotation.quotationNumber,
    version: quotation.version,
    revisionCount: 1,
    sourceLabel: SOURCE_OPTIONS.find((option) => option.value === quotation.source)?.label ?? quotation.source,
    enquiryNumber: null,
    enquiryId: null,
    customerName: quotation.recipient.name ?? '—',
    phone: quotation.recipient.phone,
    whatsapp: quotation.recipient.whatsapp,
    eventType: quotation.event?.eventType ?? null,
    eventColor: quotation.event?.colorCode ?? null,
    eventName: quotation.event?.eventName ?? null,
    eventDate: quotation.event?.eventDate ?? null,
    ownerName: quotation.owner?.fullName ?? null,
    totalAmount: quotation.totalAmount,
    status: quotation.status,
    quotationDate: quotation.quotationDate,
  };
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

export default function QuotationListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canCreate = usePermission('QUOTATIONS', 'canCreate');
  const canExport = usePermission('QUOTATIONS', 'canExport');
  const canEdit = usePermission('QUOTATIONS', 'canEdit');
  const canPrint = usePermission('QUOTATIONS', 'canPrint');
  const canViewCustomers = usePermission('CUSTOMERS', 'canView');

  // Filters live in the query string, so a refresh, a bookmark or a shared link all reproduce the
  // same view and browser Back steps through filter changes — same contract as the Enquiries list.
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') ?? '';
  const status = (searchParams.get('status') ?? '') as QuotationStatus | '';
  const sourceFilter = (searchParams.get('source') ?? '') as QuotationSource | '';
  const customerId = searchParams.get('customer') ?? '';
  const assignedUserId = searchParams.get('user') ?? '';
  const dateFrom = parseParamDate(searchParams.get('from'));
  const dateTo = parseParamDate(searchParams.get('to'));
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Number(searchParams.get('limit')) || 20;

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewQuotationId, setPreviewQuotationId] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<FlatRow | null>(null);
  const [menuState, setMenuState] = useState<{ anchor: HTMLElement; row: FlatRow } | null>(null);
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
    queryKey: ['quotations', 'stats'],
    queryFn: () => quotationService.getStats(),
  });

  const { data: userOptions } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => userService.listActive(),
  });

  // Gated on the same permission the API enforces, so a role without customer access doesn't get
  // a filter that always comes back empty.
  const { data: customerOptions } = useQuery({
    queryKey: ['customers', 'options'],
    queryFn: () => customerService.listOptions(),
    enabled: canViewCustomers,
  });

  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: [
      'quotations-grouped',
      {
        page,
        limit,
        search,
        status,
        sourceFilter,
        customerId,
        assignedUserId,
        dateFrom: dateFrom?.format('YYYY-MM-DD'),
        dateTo: dateTo?.format('YYYY-MM-DD'),
      },
    ],
    queryFn: () =>
      quotationService.listGrouped({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
        source: sourceFilter || undefined,
        customerId: customerId || undefined,
        assignedUserId: assignedUserId || undefined,
        dateFrom: dateFrom ? dateFrom.format('YYYY-MM-DD') : undefined,
        dateTo: dateTo ? dateTo.format('YYYY-MM-DD') : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  function onActionSettled() {
    queryClient.invalidateQueries({ queryKey: ['quotations-grouped'] });
    queryClient.invalidateQueries({ queryKey: ['quotations', 'stats'] });
  }

  const sendMutation = useMutation({
    mutationFn: (id: string) => quotationService.changeStatus(id, 'SENT'),
    onSuccess: onActionSettled,
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => quotationService.changeStatus(id, 'REJECTED'),
    onSuccess: onActionSettled,
  });

  const actionPending = sendMutation.isPending || rejectMutation.isPending;

  function resetFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  function toggleStatusCard(value: QuotationStatus) {
    patchParams({ status: status === value ? null : value });
  }

  async function handleConfirmAction() {
    if (!pendingAction) return;
    setActionError(null);
    try {
      if (pendingAction.action === 'send') await sendMutation.mutateAsync(pendingAction.id);
      else await rejectMutation.mutateAsync(pendingAction.id);
      setPendingAction(null);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setActionError(error.response.data.message);
      } else {
        setActionError('Action failed. Please try again.');
      }
    }
  }

  async function handleDownloadPdf(row: FlatRow) {
    try {
      await quotationService.downloadPdf(row.quotationId, `${row.quotationNumber}-v${row.version}.pdf`);
    } catch {
      showToast('Unable to download the quotation PDF.', 'error');
    }
  }

  async function handlePrint(row: FlatRow) {
    try {
      await quotationService.openPdf(row.quotationId);
    } catch {
      showToast('Unable to open the quotation PDF.', 'error');
    }
  }

  // Confirmed before opening WhatsApp — the link leaves the app with a message already composed,
  // so it should never fire from a stray click on a row action.
  function confirmShare() {
    if (!shareTarget) return;
    const link = buildQuotationWhatsAppLink({
      quotationNumber: shareTarget.quotationNumber,
      recipientName: shareTarget.customerName,
      whatsapp: shareTarget.whatsapp,
      phone: shareTarget.phone,
    });
    setShareTarget(null);
    if (!link) {
      showToast('No WhatsApp number is available for this quotation.', 'error');
      return;
    }
    window.open(link, '_blank', 'noopener');
  }

  // Every row — enquiry group or standalone — opens the quotation's own view page. The enquiry is
  // still one click away from there ("md files/Quotation/cr1.md" §Row Click Behaviour).
  function openRow(row: FlatRow) {
    navigate(`/quotations/${row.quotationId}`);
  }

  const rows = (data?.records ?? []).map(flatten);

  // Everything currently narrowing the list, as individually removable chips — so an unexpected
  // result count always has a visible cause, and one filter can be dropped without a full reset.
  const activeFilters: ActiveFilterChip[] = [];
  if (search) {
    activeFilters.push({ key: 'q', label: `Search: "${search}"`, onClear: () => patchParams({ q: null }) });
  }
  if (status) {
    activeFilters.push({
      key: 'status',
      label: `Status: ${resolveStatusConfig('quotation', status).label}`,
      onClear: () => patchParams({ status: null }),
    });
  }
  if (sourceFilter) {
    activeFilters.push({
      key: 'source',
      label: `Source: ${SOURCE_OPTIONS.find((option) => option.value === sourceFilter)?.label ?? sourceFilter}`,
      onClear: () => patchParams({ source: null }),
    });
  }
  if (customerId) {
    const customer = customerOptions?.find((option) => option.id === customerId);
    activeFilters.push({
      key: 'customer',
      label: `Customer: ${customer?.customerName ?? 'Selected customer'}`,
      onClear: () => patchParams({ customer: null }),
    });
  }
  if (assignedUserId) {
    const user = userOptions?.find((option) => option.id === assignedUserId);
    activeFilters.push({
      key: 'user',
      label: `Assigned: ${user?.fullName ?? 'Selected user'}`,
      onClear: () => patchParams({ user: null }),
    });
  }
  if (dateFrom || dateTo) {
    activeFilters.push({
      key: 'range',
      label: `Date ${dateFrom ? formatDate(dateFrom.toISOString()) : '…'} – ${
        dateTo ? formatDate(dateTo.toISOString()) : '…'
      }`,
      onClear: () => patchParams({ from: null, to: null }),
    });
  }

  const columns: DataTableColumn<FlatRow>[] = [
    {
      key: 'quotationNumber',
      header: 'Quotation No',
      sortable: true,
      width: 160,
      // A real anchor, so the number also supports middle-click and ctrl-click to open in a new tab.
      render: (row) => (
        <div className="tw-min-w-0">
          <Link
            to={`/quotations/${row.quotationId}`}
            className="tw-block tw-truncate tw-font-bold tw-tabular-nums tw-text-brand tw-no-underline hover:tw-underline"
          >
            {row.quotationNumber}
          </Link>
          <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
            {row.enquiryNumber ?? row.sourceLabel}
          </div>
        </div>
      ),
      exportValue: (row) => row.quotationNumber,
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      width: 160,
      render: (row) => (
        <div className="tw-min-w-0">
          <div className="tw-truncate tw-font-semibold tw-leading-tight">{row.customerName || '—'}</div>
          <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
            {row.phone || 'No mobile'}
          </div>
        </div>
      ),
      exportValue: (row) => `${row.customerName}${row.phone ? ` (${row.phone})` : ''}`,
    },
    {
      key: 'event',
      header: 'Event',
      width: 155,
      render: (row) =>
        row.eventType ? (
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <span
              aria-hidden
              className="tw-h-2 tw-w-2 tw-shrink-0 tw-rounded-full"
              style={{ backgroundColor: row.eventColor ?? '#2563EB' }}
            />
            <div className="tw-min-w-0">
              <div className="tw-truncate tw-font-semibold tw-leading-tight">{row.eventType}</div>
              <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
                {row.eventName || (row.eventDate ? formatDate(row.eventDate) : 'Date not set')}
              </div>
            </div>
          </div>
        ) : (
          <span className="tw-text-ink-muted dark:tw-text-ink-dark-muted">—</span>
        ),
      exportValue: (row) => [row.eventType, row.eventName].filter(Boolean).join(' – '),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      width: 125,
      render: (row) => (
        <div className="tw-min-w-0">
          <div className="tw-truncate tw-font-bold tw-tabular-nums">{formatCurrency(row.totalAmount)}</div>
          <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">GST included</div>
        </div>
      ),
      exportValue: (row) => row.totalAmount,
    },
    {
      key: 'revision',
      header: 'Revision',
      align: 'center',
      width: 95,
      render: (row) => (
        <div className="tw-min-w-0">
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-slate-100 tw-px-2 tw-py-0.5 tw-text-xs tw-font-bold tw-text-ink dark:tw-bg-slate-700 dark:tw-text-ink-dark">
            v{row.version}
          </span>
          {row.revisionCount > 1 && (
            <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
              {row.revisionCount} versions
            </div>
          )}
        </div>
      ),
      exportValue: (row) => `v${row.version}`,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: 115,
      render: (row) => <StatusBadge type="quotation" status={row.status} size="sm" />,
      exportValue: (row) => row.status,
    },
    {
      key: 'quotationDate',
      header: 'Quotation Date',
      sortable: true,
      width: 130,
      render: (row) => (
        <div className="tw-min-w-0">
          <div className="tw-truncate tw-font-semibold">{formatDate(row.quotationDate)}</div>
          <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
            {dayjs(row.quotationDate).fromNow()}
          </div>
        </div>
      ),
      exportValue: (row) => formatDate(row.quotationDate),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: 125,
      render: (row) => (
        <div className="tw-flex tw-justify-center tw-gap-0.5">
          <IconButton
            title="View quotation"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/quotations/${row.quotationId}`);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {canPrint && (
            <IconButton
              title="Download PDF"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                void handleDownloadPdf(row);
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            title="More actions"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              const trigger = event.currentTarget;
              setMenuState((current) => (current ? null : { anchor: trigger, row }));
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </div>
      ),
    },
  ];

  const menuRow = menuState?.row;
  const canEditMenuRow = Boolean(menuRow) && canEdit && isQuotationEditable(menuRow!.status);
  const totalRecords = data?.meta?.totalRecords;

  return (
    <div>
      <PageHeader
        title="Quotation Management"
        subtitle="Manage customer quotations, revisions and approvals."
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Quotations' }]}
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
              <Button variant="primary" startIcon={<AddIcon fontSize="small" />} onClick={() => navigate('/quotations/new')}>
                Create Quotation
              </Button>
            )}
          </>
        }
      />

      {/* Summary tiles, matching the Orders index. Each status metric doubles as a one-click
          filter; Revenue is a total, not a filter, so it carries no onClick. */}
      <div className="tw-mb-4 tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-5">
        <StatCard
          label="Draft"
          value={stats?.draft ?? 0}
          icon={<DescriptionIcon />}
          tone="slate"
          loading={statsLoading}
          onClick={() => toggleStatusCard('DRAFT')}
          selected={status === 'DRAFT'}
        />
        <StatCard
          label="Sent"
          value={stats?.sent ?? 0}
          icon={<SendIcon />}
          tone="cyan"
          loading={statsLoading}
          onClick={() => toggleStatusCard('SENT')}
          selected={status === 'SENT'}
        />
        <StatCard
          label="Approved"
          value={stats?.approved ?? 0}
          icon={<CheckCircleIcon />}
          tone="green"
          loading={statsLoading}
          onClick={() => toggleStatusCard('APPROVED')}
          selected={status === 'APPROVED'}
        />
        <StatCard
          label="Rejected"
          value={stats?.rejected ?? 0}
          icon={<CancelIcon />}
          tone="red"
          loading={statsLoading}
          onClick={() => toggleStatusCard('REJECTED')}
          selected={status === 'REJECTED'}
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(stats?.revenue ?? 0)}
          icon={<RequestQuoteIcon />}
          tone="blue"
          loading={statsLoading}
        />
      </div>

      {actionError && (
        <div className="tw-mb-4 tw-rounded-card tw-border tw-border-danger/40 tw-bg-danger/10 tw-px-4 tw-py-3 tw-text-sm tw-text-danger">
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
            <span>{actionError}</span>
            <IconButton title="Dismiss" size="xs" onClick={() => setActionError(null)}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </div>
        </div>
      )}

      {/* Compact filter bar: everything on one line, wrapping only when the viewport forces it.
          Filters apply as they change, so there is no Apply button — clearing is handled by the
          active-filter chips below. */}
      <div className={`${CARD_SURFACE} tw-mb-4 tw-flex tw-flex-col tw-gap-2.5 tw-px-3 tw-py-2.5`}>
        <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-2.5">
          <div className="tw-flex-[2] tw-basis-[220px]">
            <SearchBar
              fullWidth
              value={search}
              onChange={(value) => patchParams({ q: value || null })}
              onSubmit={() => void refetch()}
              placeholder="Search quotation no, enquiry, customer, mobile..."
            />
          </div>

          <SelectField
            className={FILTER_FIELD_WIDTH}
            label="Status"
            emptyLabel="All"
            value={status}
            onChange={(value) => patchParams({ status: value || null })}
            options={STATUS_OPTIONS.map((option) => ({
              value: option,
              label: resolveStatusConfig('quotation', option).label,
            }))}
          />

          <SelectField
            className={FILTER_FIELD_WIDTH}
            label="Source"
            emptyLabel="All"
            value={sourceFilter}
            onChange={(value) => patchParams({ source: value || null })}
            options={SOURCE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          />

          {canViewCustomers && (
            <SelectField
              className={FILTER_FIELD_WIDTH}
              label="Customer"
              emptyLabel="All"
              value={customerId}
              onChange={(value) => patchParams({ customer: value || null })}
              options={(customerOptions ?? []).map((option) => ({
                value: option.id,
                label: option.customerName,
              }))}
            />
          )}

          <SelectField
            className={FILTER_FIELD_WIDTH}
            label="Assigned User"
            emptyLabel="All"
            value={assignedUserId}
            onChange={(value) => patchParams({ user: value || null })}
            options={(userOptions ?? []).map((option) => ({ value: option.id, label: option.fullName }))}
          />

          <div className="tw-flex-1 tw-basis-[145px]">
            <DatePickerField
              label="Date From"
              margin="none"
              value={dateFrom}
              onChange={(value) => patchParams({ from: formatParamDate(value) })}
            />
          </div>
          <div className="tw-flex-1 tw-basis-[145px]">
            <DatePickerField
              label="Date To"
              margin="none"
              value={dateTo}
              onChange={(value) => patchParams({ to: formatParamDate(value) })}
              minDate={dateFrom ?? undefined}
            />
          </div>

          <Button variant="outlined" onClick={resetFilters}>
            Reset
          </Button>
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
        rows={rows}
        getRowId={(row) => row.rowId}
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
        rowAccentColor={(row) => QUOTATION_ROW_ACCENT[row.status]}
        onPageChange={(nextPage) => patchParams({ page: String(nextPage) })}
        onLimitChange={(newLimit) => patchParams({ limit: String(newLimit) })}
        onRowClick={openRow}
        emptyState={{
          icon: <RequestQuoteIcon sx={{ fontSize: 36 }} />,
          title: activeFilters.length > 0 ? 'No quotations match these filters' : 'No quotations yet',
          description:
            activeFilters.length > 0
              ? 'Try widening the date range or clearing a filter.'
              : canCreate
                ? 'Create your first quotation from an enquiry, a customer, or manually.'
                : 'No quotations found.',
          action:
            activeFilters.length > 0 ? (
              <Button onClick={resetFilters}>Reset Filters</Button>
            ) : canCreate ? (
              <Button variant="primary" startIcon={<AddIcon fontSize="small" />} onClick={() => navigate('/quotations/new')}>
                Create Quotation
              </Button>
            ) : undefined,
        }}
        exportFileName="quotations"
        canExport={canExport}
        highlightRowId={highlightId}
      />

      {!canCreate && (
        <p className="tw-mt-2 tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
          You have view-only access to Quotations.
        </p>
      )}

      <Menu anchorEl={menuState?.anchor} open={Boolean(menuState)} onClose={() => setMenuState(null)} align="right">
        <MenuItem
          icon={<VisibilityIcon fontSize="small" />}
          onClick={() => {
            if (menuRow) setPreviewQuotationId(menuRow.quotationId);
            setMenuState(null);
          }}
        >
          Preview Document
        </MenuItem>

        {canEditMenuRow && (
          <MenuItem
            icon={<EditIcon fontSize="small" />}
            onClick={() => {
              if (menuRow) navigate(`/quotations/${menuRow.quotationId}/edit`);
              setMenuState(null);
            }}
          >
            Edit
          </MenuItem>
        )}

        {canPrint && (
          <MenuItem
            icon={<PrintIcon fontSize="small" />}
            onClick={() => {
              if (menuRow) void handlePrint(menuRow);
              setMenuState(null);
            }}
          >
            Print
          </MenuItem>
        )}

        {menuRow && canShareQuotation(menuRow.status) && (
          <MenuItem
            icon={<WhatsAppIcon fontSize="small" />}
            onClick={() => {
              setShareTarget(menuRow);
              setMenuState(null);
            }}
          >
            Send WhatsApp
          </MenuItem>
        )}

        {menuRow?.enquiryId && (
          <MenuItem
            icon={<RequestQuoteIcon fontSize="small" />}
            onClick={() => {
              navigate(`/quotations/new?enquiryId=${menuRow.enquiryId}`);
              setMenuState(null);
            }}
          >
            Create Revision
          </MenuItem>
        )}

        {canEdit && menuRow?.status === 'DRAFT' && (
          <MenuItem
            icon={<SendIcon fontSize="small" />}
            onClick={() => {
              if (menuRow) {
                setPendingAction({ id: menuRow.quotationId, quotationNumber: menuRow.quotationNumber, action: 'send' });
              }
              setMenuState(null);
            }}
          >
            Mark as Sent
          </MenuItem>
        )}

        {canEdit && menuRow?.status === 'SENT' && (
          <MenuItem
            icon={<CancelIcon fontSize="small" />}
            onClick={() => {
              if (menuRow) {
                setPendingAction({ id: menuRow.quotationId, quotationNumber: menuRow.quotationNumber, action: 'reject' });
              }
              setMenuState(null);
            }}
          >
            Reject
          </MenuItem>
        )}
      </Menu>

      {pendingAction && (
        <ConfirmDialog
          open
          title={ACTION_COPY[pendingAction.action].title}
          message={ACTION_COPY[pendingAction.action].message(pendingAction.quotationNumber)}
          danger={ACTION_COPY[pendingAction.action].danger}
          loading={actionPending}
          onConfirm={handleConfirmAction}
          onClose={() => setPendingAction(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(shareTarget)}
        title="Send on WhatsApp?"
        message={`Open WhatsApp with a message about quotation "${shareTarget?.quotationNumber ?? ''}" for ${
          shareTarget?.customerName ?? 'this customer'
        }?`}
        confirmLabel="Open WhatsApp"
        onConfirm={confirmShare}
        onClose={() => setShareTarget(null)}
      />

      <QuotationPreviewDialog quotationId={previewQuotationId} onClose={() => setPreviewQuotationId(null)} />
    </div>
  );
}
