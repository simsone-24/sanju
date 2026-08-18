import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Box, MenuItem, Stack, TextField } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { DatePickerField } from '../../../components/DatePickerField';
import { StatCard } from '../../../components/StatCard';
import { usePermission } from '../../../hooks/usePermission';
import * as eventTypeService from '../../../services/eventTypeService';
import * as reportService from '../../../services/reportService';
import type { RevenuePaymentRow } from '../../../types/report';
import { formatCurrency, formatDate } from '../../../utils/format';
import { toOptionalId } from '../../../utils/ids';
import { BreakdownBarList } from '../BreakdownBarList';
import { ReportFilterBar } from '../ReportFilterBar';
import { ReportPanel } from '../ReportPanel';
import { STAT_ROW_SX } from '../reportLayout';

// The API groups by calendar month and returns `YYYY-MM`. Anchored to the first of the month
// before formatting — a bare "2026-08" is not a date dayjs is obliged to parse.
function monthLabel(month: string): string {
  const parsed = dayjs(`${month}-01`);
  return parsed.isValid() ? parsed.format('MMM YYYY') : month;
}

export default function RevenueReportTab() {
  const canExport = usePermission('REPORTS', 'canExport');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [eventTypeId, setEventTypeId] = useState('');

  const { data: eventTypes } = useQuery({
    queryKey: ['event-types', 'active'],
    queryFn: () => eventTypeService.listActive(),
  });

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
        eventTypeId: toOptionalId(eventTypeId),
      }),
    placeholderData: keepPreviousData,
  });

  const filtersActive = Boolean(dateFrom || dateTo || eventTypeId);

  function clearFilters() {
    setDateFrom(null);
    setDateTo(null);
    setEventTypeId('');
    setPage(1);
  }

  const columns: DataTableColumn<RevenuePaymentRow>[] = [
    {
      key: 'paymentDate',
      header: 'Date',
      render: (row) => formatDate(row.paymentDate),
      exportValue: (row) => formatDate(row.paymentDate),
    },
    {
      key: 'orderNumber',
      header: 'Order No',
      render: (row) => row.order.orderNumber,
      exportValue: (row) => row.order.orderNumber,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row) => row.order.customer.customerName,
      exportValue: (row) => row.order.customer.customerName,
    },
    { key: 'paymentType', header: 'Type', exportValue: (row) => row.paymentType },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => formatCurrency(row.amount),
      exportValue: (row) => row.amount,
    },
    { key: 'paymentMethod', header: 'Method', exportValue: (row) => row.paymentMethod },
    { key: 'receiptNumber', header: 'Receipt No', exportValue: (row) => row.receiptNumber },
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
      </ReportFilterBar>

      {/* Two lenses, deliberately labelled apart. The first three describe the events falling in
          the date range — what they are worth, what has been collected on them and what is still
          owed, which always reconcile. "Revenue in Range" is the payment-date figure: money that
          actually came in during the window, whenever its event happens. */}
      <Box sx={STAT_ROW_SX}>
        <StatCard
          label="Total Expected"
          value={formatCurrency(data?.summary.expectedAmount ?? '0')}
          icon={<SavingsIcon fontSize="small" />}
          tone="blue"
          subtext="Value of events in range"
          loading={isLoading}
        />
        <StatCard
          label="Collected"
          value={formatCurrency(data?.summary.collectedAmount ?? '0')}
          icon={<TrendingUpIcon fontSize="small" />}
          tone="green"
          subtext="Received on those events"
          loading={isLoading}
        />
        <StatCard
          label="Pending"
          value={formatCurrency(data?.summary.pendingAmount ?? '0')}
          icon={<AccountBalanceWalletIcon fontSize="small" />}
          tone="red"
          subtext="Still to collect on them"
          loading={isLoading}
        />
        <StatCard
          label="Revenue in Range"
          value={formatCurrency(data?.summary.totalRevenue ?? '0')}
          icon={<PaymentsIcon fontSize="small" />}
          tone="violet"
          subtext={`From ${data?.summary.paymentCount ?? 0} payments received`}
          loading={isLoading}
        />
      </Box>

      <Stack spacing={2.5}>
        <ReportPanel icon={<CalendarMonthIcon fontSize="small" />} title="Revenue by Month">
          <BreakdownBarList
            order="given"
            items={(data?.summary.monthly ?? []).map((point) => ({
              label: monthLabel(point.month),
              value: Number(point.amount),
              displayValue: formatCurrency(point.amount),
            }))}
          />
        </ReportPanel>

        <ReportPanel icon={<DonutSmallIcon fontSize="small" />} title="Revenue by Payment Method">
          <BreakdownBarList
            items={(data?.summary.methodBreakdown ?? []).map((entry) => ({
              label: entry.paymentMethod,
              value: Number(entry.amount),
              displayValue: formatCurrency(entry.amount),
            }))}
          />
        </ReportPanel>

        <ReportPanel icon={<ReceiptLongIcon fontSize="small" />} title="Payments">
          <DataTable
            disableContainer
            columns={columns}
            rows={data?.payments ?? []}
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
            onRowClick={(row) => navigate(`/orders/${row.order.id}`)}
            exportFileName="revenue-report"
            canExport={canExport}
            emptyState={{
              icon: <ReceiptLongIcon sx={{ fontSize: 36 }} />,
              title: 'No payments in this range',
              description: 'Widen the date range or clear the filters to see collected payments.',
            }}
          />
        </ReportPanel>
      </Stack>
    </>
  );
}
