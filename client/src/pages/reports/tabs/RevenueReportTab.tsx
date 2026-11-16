import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Box, MenuItem, Stack, TextField } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { DatePickerField } from '../../../components/DatePickerField';
import { usePermission } from '../../../hooks/usePermission';
import * as eventTypeService from '../../../services/eventTypeService';
import * as reportService from '../../../services/reportService';
import type { RevenuePaymentRow } from '../../../types/report';
import { formatCurrency, formatDate } from '../../../utils/format';
import { toOptionalId } from '../../../utils/ids';
import { DonutChart } from '../DonutChart';
import { KpiStrip } from '../KpiStrip';
import { MonthlyBarChart } from '../MonthlyBarChart';
import { ReportFilterBar } from '../ReportFilterBar';
import { ReportPanel } from '../ReportPanel';

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
      {/* Two lenses, deliberately labelled apart. The first three describe the events falling in
          the date range — what they are worth, what has been collected on them and what is still
          owed, which always reconcile. "Revenue in Range" is the payment-date figure: money that
          actually came in during the window, whenever its event happens. */}
      <KpiStrip
        loading={isLoading}
        items={[
          { label: 'Total Expected', value: formatCurrency(data?.summary.expectedAmount ?? '0'), subtext: 'Value of events in range' },
          { label: 'Collected', value: formatCurrency(data?.summary.collectedAmount ?? '0'), subtext: 'Received on those events', tone: 'positive' },
          { label: 'Pending', value: formatCurrency(data?.summary.pendingAmount ?? '0'), subtext: 'Still to collect on them', tone: 'due' },
          {
            label: 'Revenue in Range',
            value: formatCurrency(data?.summary.totalRevenue ?? '0'),
            subtext: `From ${data?.summary.paymentCount ?? 0} payments received`,
          },
        ]}
      />

      <Stack spacing={2.5}>
        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
          <ReportPanel icon={<CalendarMonthIcon fontSize="small" />} title="Revenue by Month">
            <MonthlyBarChart
              ariaLabel="Bar chart of revenue collected in each month"
              points={(data?.summary.monthly ?? []).map((point) => ({
                label: monthLabel(point.month),
                value: Number(point.amount),
                tooltip: `${monthLabel(point.month)}: ${formatCurrency(point.amount)} (${point.paymentCount} payment(s))`,
              }))}
            />
          </ReportPanel>

          <ReportPanel icon={<DonutSmallIcon fontSize="small" />} title="Revenue by Payment Method">
            <DonutChart
              ariaLabel="Donut chart of revenue by payment method"
              centerLabel={formatCurrency(data?.summary.totalRevenue ?? '0')}
              centerCaption="Total"
              slices={(data?.summary.methodBreakdown ?? []).map((entry) => ({
                label: entry.paymentMethod,
                value: Number(entry.amount),
                displayValue: formatCurrency(entry.amount),
              }))}
            />
          </ReportPanel>
        </Box>

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
