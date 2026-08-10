import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import { Autocomplete, Box, MenuItem, TextField } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { DatePickerField } from '../../../components/DatePickerField';
import { StatCard } from '../../../components/StatCard';
import { StatusBadge } from '../../../components/StatusBadge';
import { usePermission } from '../../../hooks/usePermission';
import * as customerService from '../../../services/customerService';
import * as eventTypeService from '../../../services/eventTypeService';
import * as reportService from '../../../services/reportService';
import type { CustomerOption } from '../../../types/masters';
import type { OutstandingOrderRow } from '../../../types/report';
import { formatCurrency, formatDate } from '../../../utils/format';
import { ReportFilterBar } from '../ReportFilterBar';
import { ReportPanel } from '../ReportPanel';
import { STAT_ROW_SX } from '../reportLayout';

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

  const { data: eventTypes } = useQuery({
    queryKey: ['event-types', 'active'],
    queryFn: () => eventTypeService.listActive(),
  });

  const { data: customerOptions } = useQuery({
    queryKey: ['customers', 'search', customerSearchInput],
    queryFn: () => customerService.search(customerSearchInput),
    enabled: customerSearchInput.trim().length > 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      'reports',
      'outstanding',
      {
        page,
        limit,
        dateFrom: dateFrom?.format('YYYY-MM-DD'),
        dateTo: dateTo?.format('YYYY-MM-DD'),
        eventTypeId,
        customerId: selectedCustomer?.id,
      },
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

  const filtersActive = Boolean(dateFrom || dateTo || eventTypeId || selectedCustomer);

  function clearFilters() {
    setDateFrom(null);
    setDateTo(null);
    setEventTypeId('');
    setSelectedCustomer(null);
    setCustomerSearchInput('');
    setPage(1);
  }

  const columns: DataTableColumn<OutstandingOrderRow>[] = [
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
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      render: (row) => formatCurrency(row.totalAmount),
      exportValue: (row) => row.totalAmount,
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      render: (row) => formatCurrency(row.paidAmount),
      exportValue: (row) => row.paidAmount,
    },
    {
      key: 'pendingAmount',
      header: 'Pending',
      align: 'right',
      // The figure the report exists for — called out in the same red the detail pages use for a
      // balance still owed.
      render: (row) => (
        <Box component="span" sx={{ fontWeight: 700, color: 'error.dark', fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(row.pendingAmount)}
        </Box>
      ),
      exportValue: (row) => row.pendingAmount,
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
        <Autocomplete
          size="small"
          options={customerOptions ?? []}
          value={selectedCustomer}
          getOptionLabel={(option) => `${option.customerName} (${option.mobile})`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onInputChange={(_event, value) => setCustomerSearchInput(value)}
          onChange={(_event, value) => {
            setSelectedCustomer(value);
            setPage(1);
          }}
          renderInput={(params) => <TextField {...params} label="Customer" placeholder="Type at least 2 characters" />}
        />
      </ReportFilterBar>

      <Box sx={STAT_ROW_SX}>
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(data?.summary.totalOutstanding ?? '0')}
          icon={<AccountBalanceWalletIcon fontSize="small" />}
          tone="red"
          subtext="Still to be collected"
          loading={isLoading}
        />
        <StatCard
          label="Orders"
          value={data?.summary.orderCount ?? 0}
          icon={<WorkHistoryIcon fontSize="small" />}
          tone="amber"
          subtext="Carrying a balance"
          loading={isLoading}
        />
      </Box>

      <ReportPanel icon={<ReceiptLongIcon fontSize="small" />} title="Orders with a Balance">
        <DataTable
          disableContainer
          columns={columns}
          rows={data?.orders ?? []}
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
          exportFileName="outstanding-report"
          canExport={canExport}
          emptyState={{
            icon: <AccountBalanceWalletIcon sx={{ fontSize: 36 }} />,
            title: 'Nothing outstanding',
            description: 'No order matching these filters has a balance left to collect.',
          }}
        />
      </ReportPanel>
    </>
  );
}
