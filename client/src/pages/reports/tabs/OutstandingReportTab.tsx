import { Autocomplete, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { DatePickerField } from '../../../components/DatePickerField';
import { StatusBadge } from '../../../components/StatusBadge';
import { usePermission } from '../../../hooks/usePermission';
import * as customerService from '../../../services/customerService';
import * as eventTypeService from '../../../services/eventTypeService';
import * as reportService from '../../../services/reportService';
import type { CustomerOption } from '../../../types/masters';
import type { OutstandingOrderRow } from '../../../types/report';
import { formatCurrency, formatDate } from '../../../utils/format';

export default function OutstandingReportTab() {
  const canExport = usePermission('REPORTS', 'canExport');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [eventTypeId, setEventTypeId] = useState('');
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  const { data: eventTypes } = useQuery({ queryKey: ['event-types', 'active'], queryFn: () => eventTypeService.listActive() });

  const { data: customerOptions } = useQuery({
    queryKey: ['customers', 'search', customerSearchInput],
    queryFn: () => customerService.search(customerSearchInput),
    enabled: customerSearchInput.trim().length > 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'reports',
      'outstanding',
      { page, limit, dateFrom: dateFrom?.format('YYYY-MM-DD'), dateTo: dateTo?.format('YYYY-MM-DD'), eventTypeId, customerId: selectedCustomer?.id },
    ],
    queryFn: () =>
      reportService.getOutstanding({
        page,
        limit,
        dateFrom: dateFrom ? dateFrom.format('YYYY-MM-DD') : undefined,
        dateTo: dateTo ? dateTo.format('YYYY-MM-DD') : undefined,
        eventTypeId: eventTypeId || undefined,
        customerId: selectedCustomer?.id,
      }),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<OutstandingOrderRow>[] = [
    { key: 'orderNumber', header: 'Order No', sortable: true },
    { key: 'customer', header: 'Customer', render: (row) => row.customer.customerName, exportValue: (row) => row.customer.customerName },
    { key: 'eventDate', header: 'Event Date', render: (row) => formatDate(row.eventDate), exportValue: (row) => formatDate(row.eventDate) },
    { key: 'totalAmount', header: 'Total', align: 'right', render: (row) => formatCurrency(row.totalAmount), exportValue: (row) => row.totalAmount },
    { key: 'paidAmount', header: 'Paid', align: 'right', render: (row) => formatCurrency(row.paidAmount), exportValue: (row) => row.paidAmount },
    { key: 'pendingAmount', header: 'Pending', align: 'right', render: (row) => formatCurrency(row.pendingAmount), exportValue: (row) => row.pendingAmount },
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
        <Autocomplete
          sx={{ minWidth: 260 }}
          size="small"
          options={customerOptions ?? []}
          value={selectedCustomer}
          getOptionLabel={(option) => `${option.customerName} (${option.mobile})`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onInputChange={(_event, value) => setCustomerSearchInput(value)}
          onChange={(_event, value) => { setSelectedCustomer(value); setPage(1); }}
          renderInput={(params) => <TextField {...params} label="Customer" helperText="Type at least 2 characters." />}
        />
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 180 }}>
          <Typography variant="body2" color="text.secondary">Total Outstanding</Typography>
          <Typography variant="h2">{formatCurrency(data?.summary.totalOutstanding ?? '0')}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 180 }}>
          <Typography variant="body2" color="text.secondary">Orders</Typography>
          <Typography variant="h2">{data?.summary.orderCount ?? 0}</Typography>
        </Paper>
      </Stack>

      <DataTable
        columns={columns}
        rows={data?.orders ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        meta={data?.meta}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
        emptyMessage="No outstanding orders found for the selected filters."
        exportFileName="outstanding-report"
        canExport={canExport}
      />
    </>
  );
}
