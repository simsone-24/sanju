import { MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { DatePickerField } from '../../../components/DatePickerField';
import { usePermission } from '../../../hooks/usePermission';
import * as eventTypeService from '../../../services/eventTypeService';
import * as reportService from '../../../services/reportService';
import type { RevenuePaymentRow } from '../../../types/report';
import { formatCurrency, formatDate } from '../../../utils/format';
import { BreakdownBarList } from '../BreakdownBarList';

export default function RevenueReportTab() {
  const canExport = usePermission('REPORTS', 'canExport');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [eventTypeId, setEventTypeId] = useState('');

  const { data: eventTypes } = useQuery({ queryKey: ['event-types', 'active'], queryFn: () => eventTypeService.listActive() });

  const { data, isLoading } = useQuery({
    queryKey: [
      'reports',
      'revenue',
      { page, limit, dateFrom: dateFrom?.format('YYYY-MM-DD'), dateTo: dateTo?.format('YYYY-MM-DD'), eventTypeId },
    ],
    queryFn: () =>
      reportService.getRevenue({
        page,
        limit,
        dateFrom: dateFrom ? dateFrom.format('YYYY-MM-DD') : undefined,
        dateTo: dateTo ? dateTo.format('YYYY-MM-DD') : undefined,
        eventTypeId: eventTypeId || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<RevenuePaymentRow>[] = [
    { key: 'paymentDate', header: 'Date', render: (row) => formatDate(row.paymentDate), exportValue: (row) => formatDate(row.paymentDate) },
    { key: 'orderNumber', header: 'Order No', render: (row) => row.order.orderNumber, exportValue: (row) => row.order.orderNumber },
    { key: 'customer', header: 'Customer', render: (row) => row.order.customer.customerName, exportValue: (row) => row.order.customer.customerName },
    { key: 'paymentType', header: 'Type', exportValue: (row) => row.paymentType },
    { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount), exportValue: (row) => row.amount },
    { key: 'paymentMethod', header: 'Method', exportValue: (row) => row.paymentMethod },
    { key: 'receiptNumber', header: 'Receipt No', exportValue: (row) => row.receiptNumber },
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
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 180 }}>
          <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
          <Typography variant="h2">{formatCurrency(data?.summary.totalRevenue ?? '0')}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 180 }}>
          <Typography variant="body2" color="text.secondary">Payments</Typography>
          <Typography variant="h2">{data?.summary.paymentCount ?? 0}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 260, flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>By Payment Method</Typography>
          <BreakdownBarList
            items={(data?.summary.methodBreakdown ?? []).map((entry) => ({
              label: entry.paymentMethod,
              value: Number(entry.amount),
              displayValue: formatCurrency(entry.amount),
            }))}
          />
        </Paper>
      </Stack>

      <DataTable
        columns={columns}
        rows={data?.payments ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        meta={data?.meta}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onRowClick={(row) => navigate(`/orders/${row.order.id}`)}
        emptyMessage="No payments found for the selected filters."
        exportFileName="revenue-report"
        canExport={canExport}
      />
    </>
  );
}
