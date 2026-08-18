import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { Box, MenuItem, Stack, TextField } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { DatePickerField } from '../../../components/DatePickerField';
import { StatCard } from '../../../components/StatCard';
import { resolveStatusConfig } from '../../../components/statusConfig';
import { StatusBadge } from '../../../components/StatusBadge';
import { usePermission } from '../../../hooks/usePermission';
import * as eventTypeService from '../../../services/eventTypeService';
import * as reportService from '../../../services/reportService';
import type { OrderStatus } from '../../../types/order';
import type { EventReportRow } from '../../../types/report';
import { formatCurrency, formatDate } from '../../../utils/format';
import { toOptionalId } from '../../../utils/ids';
import { BreakdownBarList } from '../BreakdownBarList';
import { ReportFilterBar } from '../ReportFilterBar';
import { ReportPanel } from '../ReportPanel';
import { STAT_ROW_SX } from '../reportLayout';

const STATUS_OPTIONS: OrderStatus[] = ['YET_TO_START', 'IN_PROGRESS', 'ORDER_CLOSED', 'REJECTED'];

// `from`/`to` query params seed the date range once, on mount — callers link into this report with
// a range already applied (the Dashboard's upcoming-events tiles). They're then dropped from the
// URL so that leaving this tab and coming back (which unmounts and remounts it) doesn't silently
// re-apply the incoming range over whatever the user has since picked.
function initialParamDate(value: string | null): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : null;
}

export default function EventReportTab() {
  const canExport = usePermission('REPORTS', 'canExport');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(() => initialParamDate(searchParams.get('from')));
  const [dateTo, setDateTo] = useState<Dayjs | null>(() => initialParamDate(searchParams.get('to')));
  const [eventTypeId, setEventTypeId] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');

  useEffect(() => {
    if (!searchParams.has('from') && !searchParams.has('to')) return;
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('from');
        next.delete('to');
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  const { data: eventTypes } = useQuery({
    queryKey: ['event-types', 'active'],
    queryFn: () => eventTypeService.listActive(),
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'reports',
      'events',
      {
        page,
        limit,
        dateFrom: dateFrom?.format('YYYY-MM-DD'),
        dateTo: dateTo?.format('YYYY-MM-DD'),
        eventTypeId,
        status,
      },
    ],
    queryFn: () =>
      reportService.getEvents({
        page,
        limit,
        dateFrom: dateFrom ? dateFrom.format('YYYY-MM-DD') : undefined,
        dateTo: dateTo ? dateTo.format('YYYY-MM-DD') : undefined,
        eventTypeId: toOptionalId(eventTypeId),
        status: status || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const filtersActive = Boolean(dateFrom || dateTo || eventTypeId || status);

  function clearFilters() {
    setDateFrom(null);
    setDateTo(null);
    setEventTypeId('');
    setStatus('');
    setPage(1);
  }

  // The value of the events in view, not just how many — the count alone doesn't say whether a busy
  // month is a valuable one.
  const totalValue = (data?.events ?? []).reduce((sum, row) => sum + Number(row.totalAmount), 0);

  const columns: DataTableColumn<EventReportRow>[] = [
    { key: 'orderNumber', header: 'Order No', sortable: true },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => row.customer.customerName,
      exportValue: (row) => row.customer.customerName,
    },
    {
      key: 'eventDate',
      header: 'Event Date',
      render: (row) => formatDate(row.eventDate),
      exportValue: (row) => formatDate(row.eventDate),
    },
    { key: 'venue', header: 'Venue', render: (row) => row.venue ?? '—', exportValue: (row) => row.venue ?? '' },
    {
      key: 'eventType',
      header: 'Event Type',
      render: (row) => (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          {row.enquiry.eventType.colorCode && (
            <Box
              sx={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, bgcolor: row.enquiry.eventType.colorCode }}
            />
          )}
          <span>{row.enquiry.eventType.eventName}</span>
        </Stack>
      ),
      exportValue: (row) => row.enquiry.eventType.eventName,
    },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      render: (row) => formatCurrency(row.totalAmount),
      exportValue: (row) => row.totalAmount,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge type="order" status={row.status} size="sm" />,
      exportValue: (row) => row.status,
    },
  ];

  return (
    <>
      <ReportFilterBar onClear={clearFilters} active={filtersActive}>
        <DatePickerField
          label="Date From"
          margin="none"
          value={dateFrom}
          onChange={(value) => {
            setDateFrom(value);
            setPage(1);
          }}
        />
        <DatePickerField
          label="Date To"
          margin="none"
          value={dateTo}
          onChange={(value) => {
            setDateTo(value);
            setPage(1);
          }}
          minDate={dateFrom ?? undefined}
        />
        <TextField
          select
          size="small"
          label="Event Type"
          value={eventTypeId}
          onChange={(event) => {
            setEventTypeId(event.target.value);
            setPage(1);
          }}
        >
          <MenuItem value="">All Event Types</MenuItem>
          {eventTypes?.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.eventName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
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
      </ReportFilterBar>

      <Box sx={STAT_ROW_SX}>
        <StatCard
          label="Total Events"
          value={data?.summary.totalEvents ?? 0}
          icon={<EventNoteIcon fontSize="small" />}
          tone="violet"
          subtext="Matching the filters"
          loading={isLoading}
        />
        <StatCard
          label="Value on This Page"
          value={formatCurrency(totalValue)}
          icon={<DonutSmallIcon fontSize="small" />}
          tone="blue"
          subtext={`Across ${data?.events.length ?? 0} events shown`}
          loading={isLoading}
        />
      </Box>

      <Stack spacing={2.5}>
        <ReportPanel icon={<DonutSmallIcon fontSize="small" />} title="Events by Status">
          <BreakdownBarList
            items={(data?.summary.statusCounts ?? []).map((entry) => ({
              label: resolveStatusConfig('order', entry.status).label,
              value: entry.count,
              displayValue: String(entry.count),
            }))}
          />
        </ReportPanel>

        <ReportPanel icon={<EventNoteIcon fontSize="small" />} title="Events">
          <DataTable
            disableContainer
            columns={columns}
            rows={data?.events ?? []}
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
            onRowClick={(row) => navigate(`/orders/${row.id}`)}
            exportFileName="event-report"
            canExport={canExport}
            emptyState={{
              icon: <EventNoteIcon sx={{ fontSize: 36 }} />,
              title: 'No events in this range',
              description: 'Widen the date range or clear the filters to see scheduled events.',
            }}
          />
        </ReportPanel>
      </Stack>
    </>
  );
}
