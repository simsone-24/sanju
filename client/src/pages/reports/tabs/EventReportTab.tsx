import { Box, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { DatePickerField } from '../../../components/DatePickerField';
import { StatusBadge } from '../../../components/StatusBadge';
import { usePermission } from '../../../hooks/usePermission';
import * as eventTypeService from '../../../services/eventTypeService';
import * as reportService from '../../../services/reportService';
import type { OrderStatus } from '../../../types/order';
import type { EventReportRow } from '../../../types/report';
import { formatCurrency, formatDate } from '../../../utils/format';
import { BreakdownBarList } from '../BreakdownBarList';

const STATUS_OPTIONS: OrderStatus[] = [
  'CONFIRMED',
  'ADVANCE_PENDING',
  'ADVANCE_RECEIVED',
  'PLANNING',
  'READY',
  'IN_PROGRESS',
  'COMPLETED',
  'BALANCE_PENDING',
  'CLOSED',
  'CANCELLED',
];

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

  const { data: eventTypes } = useQuery({ queryKey: ['event-types', 'active'], queryFn: () => eventTypeService.listActive() });

  const { data, isLoading } = useQuery({
    queryKey: [
      'reports',
      'events',
      { page, limit, dateFrom: dateFrom?.format('YYYY-MM-DD'), dateTo: dateTo?.format('YYYY-MM-DD'), eventTypeId, status },
    ],
    queryFn: () =>
      reportService.getEvents({
        page,
        limit,
        dateFrom: dateFrom ? dateFrom.format('YYYY-MM-DD') : undefined,
        dateTo: dateTo ? dateTo.format('YYYY-MM-DD') : undefined,
        eventTypeId: eventTypeId || undefined,
        status: status || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<EventReportRow>[] = [
    { key: 'orderNumber', header: 'Order No', sortable: true },
    { key: 'customer', header: 'Customer', render: (row) => row.customer.customerName, exportValue: (row) => row.customer.customerName },
    { key: 'eventDate', header: 'Event Date', render: (row) => formatDate(row.eventDate), exportValue: (row) => formatDate(row.eventDate) },
    { key: 'venue', header: 'Venue', render: (row) => row.venue ?? '—', exportValue: (row) => row.venue ?? '' },
    {
      key: 'eventType',
      header: 'Event Type',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          {row.enquiry.eventType.colorCode && (
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.enquiry.eventType.colorCode }} />
          )}
          <span>{row.enquiry.eventType.eventName}</span>
        </Stack>
      ),
      exportValue: (row) => row.enquiry.eventType.eventName,
    },
    { key: 'totalAmount', header: 'Total', align: 'right', render: (row) => formatCurrency(row.totalAmount), exportValue: (row) => row.totalAmount },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge type="order" status={row.status} size="sm" />, exportValue: (row) => row.status },
  ];

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <DatePickerField label="Date From" margin="none" value={dateFrom} onChange={(value) => { setDateFrom(value); setPage(1); }} />
        <DatePickerField label="Date To" margin="none" value={dateTo} onChange={(value) => { setDateTo(value); setPage(1); }} minDate={dateFrom ?? undefined} />
        <TextField
          select
          size="small"
          label="Event Type"
          value={eventTypeId}
          onChange={(event) => { setEventTypeId(event.target.value); setPage(1); }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Event Types</MenuItem>
          {eventTypes?.map((type) => (
            <MenuItem key={type.id} value={type.id}>{type.eventName}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(event) => { setStatus(event.target.value as OrderStatus | ''); setPage(1); }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>{option.replaceAll('_', ' ')}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 180 }}>
          <Typography variant="body2" color="text.secondary">Total Events</Typography>
          <Typography variant="h2">{data?.summary.totalEvents ?? 0}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 260, flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>By Status</Typography>
          <BreakdownBarList
            items={(data?.summary.statusCounts ?? []).map((entry) => ({
              label: entry.status.replaceAll('_', ' '),
              value: entry.count,
              displayValue: String(entry.count),
            }))}
          />
        </Paper>
      </Stack>

      <DataTable
        columns={columns}
        rows={data?.events ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        meta={data?.meta}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
        emptyMessage="No events found for the selected filters."
        exportFileName="event-report"
        canExport={canExport}
      />
    </>
  );
}
