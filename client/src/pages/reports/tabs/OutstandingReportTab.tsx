import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Autocomplete, Box, Chip, TextField } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { usePermission } from '../../../hooks/usePermission';
import * as customerService from '../../../services/customerService';
import * as reportService from '../../../services/reportService';
import type { CustomerOption } from '../../../types/masters';
import type { PaymentTrackerStatus } from '../../../types/paymentTracker';
import type { OutstandingMonthlyRow, OutstandingOrderRow } from '../../../types/report';
import { formatCurrency } from '../../../utils/format';
import { ReportFilterBar } from '../ReportFilterBar';
import { ReportPanel } from '../ReportPanel';
import { KpiStrip } from '../KpiStrip';
import { MonthlyReportTable } from '../MonthlyReportTable';
import { monthLabel } from '../monthLabel';
import { reportOrderColumns } from '../orderColumns';
import { PeriodFilter } from '../PeriodFilter';
import { useReportPeriod } from '../useReportPeriod';

const STATUS_LABEL: Record<PaymentTrackerStatus, string> = {
  PENDING: 'Pending',
  ADVANCE_PAID: 'Advance Paid',
  PARTIAL_PAYMENT: 'Partial Payment',
  FULLY_PAID: 'Fully Paid',
};

export default function OutstandingReportTab() {
  const canExport = usePermission('REPORTS', 'canExport');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const period = useReportPeriod();
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  // Set by clicking a status card; narrows the Orders table only — the cards keep their figures.
  const [paymentStatus, setPaymentStatus] = useState<PaymentTrackerStatus | ''>('');

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
        dateFrom: period.range.from,
        dateTo: period.range.to,
        customerId: selectedCustomer?.id,
        paymentStatus,
      },
    ],
    queryFn: () =>
      reportService.getOutstanding({
        page,
        limit,
        dateFrom: period.range.from,
        dateTo: period.range.to,
        customerId: selectedCustomer?.id,
        paymentStatus: paymentStatus || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const filtersActive = Boolean(!period.isDefault || selectedCustomer || paymentStatus);

  /** Selects a status card, or clears the selection when that card is already the one in force. */
  function toggleStatus(status: PaymentTrackerStatus | '') {
    setPaymentStatus((current) => (current === status ? '' : status));
    setPage(1);
  }

  function clearFilters() {
    period.reset();
    setSelectedCustomer(null);
    setCustomerSearchInput('');
    setPaymentStatus('');
    setPage(1);
  }

  // One row per order, laid out like the Payment Tracker's table (shared with the Revenue tab).
  const columns = reportOrderColumns<OutstandingOrderRow>();
  const byStatus = data?.summary.byStatus;

  // Grouped by the month of the event — the same lens as this report's date filter.
  const monthlyColumns: DataTableColumn<OutstandingMonthlyRow>[] = [
    { key: 'month', header: 'Event Month', render: (row) => monthLabel(row.month), exportValue: (row) => monthLabel(row.month) },
    { key: 'orderCount', header: 'Orders', align: 'right', exportValue: (row) => String(row.orderCount) },
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
      header: 'Outstanding',
      align: 'right',
      render: (row) => (
        <Box component="span" sx={{ fontWeight: 700, color: 'error.dark', fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(row.pendingAmount)}
        </Box>
      ),
      exportValue: (row) => row.pendingAmount,
    },
  ];

  return (
    <>
      <ReportFilterBar onClear={clearFilters} active={filtersActive}>
        <PeriodFilter period={period} onChange={() => setPage(1)} />
        <Autocomplete
          size="small"
          options={customerOptions ?? []}
          value={selectedCustomer}
          getOptionLabel={(option) => option.mobile ? `${option.customerName} (${option.mobile})` : option.customerName}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onInputChange={(_event, value) => setCustomerSearchInput(value)}
          onChange={(_event, value) => {
            setSelectedCustomer(value);
            setPage(1);
          }}
          renderInput={(params) => <TextField {...params} label="Customer" placeholder="Type at least 2 characters" />}
        />
      </ReportFilterBar>

      {/* Every outstanding order in the period, then the same orders split by Payment Tracker status.
          Clicking a status card narrows the Orders table below to those orders; Total Outstanding
          (or the tag's ✕, or Reset) shows them all again. */}
      <KpiStrip
        loading={isLoading}
        items={[
          {
            label: 'Total Outstanding',
            value: formatCurrency(data?.summary.totalOutstanding ?? '0'),
            subtext: [
              `${data?.summary.orderCount ?? 0} orders`,
              period.view === 'MONTHLY' ? period.month.format('MMMM YYYY') : period.year.format('YYYY'),
            ],
            tone: 'due',
            onClick: () => toggleStatus(''),
            selected: paymentStatus === '',
          },
          {
            label: 'Pending',
            value: formatCurrency(byStatus?.pending.amount ?? '0'),
            subtext: [`${byStatus?.pending.orderCount ?? 0} orders`, 'Nothing paid yet'],
            onClick: () => toggleStatus('PENDING'),
            selected: paymentStatus === 'PENDING',
          },
          {
            label: 'Advance Paid',
            value: formatCurrency(byStatus?.advancePaid.amount ?? '0'),
            subtext: [`${byStatus?.advancePaid.orderCount ?? 0} orders`, 'Advance received'],
            onClick: () => toggleStatus('ADVANCE_PAID'),
            selected: paymentStatus === 'ADVANCE_PAID',
          },
          {
            label: 'Partial Payment',
            value: formatCurrency(byStatus?.partialPayment.amount ?? '0'),
            subtext: [`${byStatus?.partialPayment.orderCount ?? 0} orders`, 'Part payments received'],
            onClick: () => toggleStatus('PARTIAL_PAYMENT'),
            selected: paymentStatus === 'PARTIAL_PAYMENT',
          },
        ]}
      />

      {/* One row per month — only worth showing when the period spans more than a month. */}
      {period.view === 'YEARLY' && (
        <Box sx={{ mb: 2.5 }}>
          <MonthlyReportTable
            title="Monthly Outstanding"
            columns={monthlyColumns}
            rows={data?.summary.monthly ?? []}
            getRowId={(row) => row.month ?? 'no-date'}
            loading={isLoading}
            exportFileName="outstanding-by-month"
            emptyDescription="No order matching these filters has a balance left to collect."
          />
        </Box>
      )}

      <ReportPanel
        icon={<ReceiptLongIcon fontSize="small" />}
        title="Orders with a Balance"
        action={
          paymentStatus ? (
            <Chip
              size="small"
              color="primary"
              label={STATUS_LABEL[paymentStatus]}
              onDelete={() => toggleStatus('')}
            />
          ) : undefined
        }
      >
        <DataTable
          showSerialNumber
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
            description: paymentStatus
              ? 'No outstanding order in this status for the chosen period. Remove the tag above to see them all.'
              : 'No order matching these filters has a balance left to collect.',
          }}
        />
      </ReportPanel>
    </>
  );
}
