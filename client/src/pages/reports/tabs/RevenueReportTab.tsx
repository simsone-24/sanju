import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Chip, Stack } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { usePermission } from '../../../hooks/usePermission';
import * as reportService from '../../../services/reportService';
import type { PaymentTrackerStatus } from '../../../types/paymentTracker';
import type { PaymentStatusCounts, RevenueMonthlyPoint, RevenueOrderRow } from '../../../types/report';
import { formatCurrency } from '../../../utils/format';
import { KpiStrip, type KpiChip } from '../KpiStrip';
import { MonthlyReportTable } from '../MonthlyReportTable';
import { monthLabel } from '../monthLabel';
import { reportOrderColumns } from '../orderColumns';
import { PeriodFilter } from '../PeriodFilter';
import { ReportFilterBar } from '../ReportFilterBar';
import { ReportPanel } from '../ReportPanel';
import { useReportPeriod } from '../useReportPeriod';

const STATUS_LABEL: Record<PaymentTrackerStatus, string> = {
  PENDING: 'Pending',
  ADVANCE_PAID: 'Advance Paid',
  PARTIAL_PAYMENT: 'Partial Payment',
  FULLY_PAID: 'Fully Paid',
};

/** The summary card that is open: '' means none (the whole period). */
type Card = '' | 'COLLECTED' | 'PENDING';

const CARD_LABEL: Record<Exclude<Card, ''>, string> = { COLLECTED: 'Collected', PENDING: 'Pending' };

export default function RevenueReportTab() {
  const canExport = usePermission('REPORTS', 'canExport');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const period = useReportPeriod();
  // Both narrow the Orders table only. `card` is the Collected / Pending card that was clicked; once
  // one is open its status chips appear, and clicking a chip sets `paymentStatus` within it.
  const [card, setCard] = useState<Card>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentTrackerStatus | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: [
      'reports',
      'revenue',
      { page, limit, dateFrom: period.range.from, dateTo: period.range.to, card, paymentStatus },
    ],
    queryFn: () =>
      reportService.getRevenue({
        page,
        limit,
        dateFrom: period.range.from,
        dateTo: period.range.to,
        orderBalance: card || undefined,
        paymentStatus: paymentStatus || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  /** Opens a card (or closes it if it is already open); a different card starts with no status chosen. */
  function selectCard(next: Card) {
    setCard((current) => (current === next ? '' : next));
    setPaymentStatus('');
    setPage(1);
  }

  function toggleStatus(status: PaymentTrackerStatus) {
    setPaymentStatus((current) => (current === status ? '' : status));
    setPage(1);
  }

  function clearSelection() {
    setCard('');
    setPaymentStatus('');
    setPage(1);
  }

  function clearFilters() {
    period.reset();
    clearSelection();
  }

  // One row per order, laid out like the Payment Tracker's table (shared with the Outstanding tab).
  const columns = reportOrderColumns<RevenueOrderRow>();

  const noStatuses: PaymentStatusCounts = { pending: 0, advancePaid: 0, partialPayment: 0, fullyPaid: 0 };
  const collected = data?.summary.collectedByStatus ?? noStatuses;
  const pending = data?.summary.pendingByStatus ?? noStatuses;

  function statusChip(label: string, count: number, status: PaymentTrackerStatus): KpiChip {
    return { label, count, selected: paymentStatus === status, onClick: () => toggleStatus(status) };
  }

  const monthlyColumns: DataTableColumn<RevenueMonthlyPoint>[] = [
    { key: 'month', header: 'Month', render: (row) => monthLabel(row.month), exportValue: (row) => monthLabel(row.month) },
    { key: 'paymentCount', header: 'Payments', align: 'right', exportValue: (row) => String(row.paymentCount) },
    {
      key: 'amount',
      header: 'Revenue Collected',
      align: 'right',
      render: (row) => formatCurrency(row.amount),
      exportValue: (row) => row.amount,
    },
  ];

  return (
    <>
      <ReportFilterBar onClear={clearFilters} active={!period.isDefault || card !== ''}>
        <PeriodFilter period={period} onChange={() => setPage(1)} />
      </ReportFilterBar>

      {/* The events falling in the chosen period — what they are worth, what has been collected on
          them and what is still owed, which always reconcile — each with the number of orders behind
          it. Clicking Collected or Pending filters the Orders table below to those orders and opens
          the card to show its status chips, which narrow the table further. */}
      <KpiStrip
        loading={isLoading}
        items={[
          {
            label: 'Total Expected',
            value: formatCurrency(data?.summary.expectedAmount ?? '0'),
            // Second line names the period, so this card is as tall as its neighbours' two lines.
            subtext: [
              `${data?.summary.orderCount ?? 0} orders`,
              period.view === 'MONTHLY' ? period.month.format('MMMM YYYY') : period.year.format('YYYY'),
            ],
            onClick: clearSelection,
            selected: card === '',
          },
          {
            label: 'Collected',
            value: formatCurrency(data?.summary.collectedAmount ?? '0'),
            // The breakdown reads as a plain line until the card is opened, then becomes the chips.
            subtext:
              card === 'COLLECTED'
                ? `${data?.summary.collectedOrderCount ?? 0} orders`
                : [
                    `${data?.summary.collectedOrderCount ?? 0} orders`,
                    `${collected.advancePaid} Advance · ${collected.partialPayment} Partial · ${collected.fullyPaid} Fully Paid`,
                  ],
            tone: 'positive',
            onClick: () => selectCard('COLLECTED'),
            selected: card === 'COLLECTED',
            chips: [
              statusChip('Advance', collected.advancePaid, 'ADVANCE_PAID'),
              statusChip('Partial', collected.partialPayment, 'PARTIAL_PAYMENT'),
              statusChip('Fully Paid', collected.fullyPaid, 'FULLY_PAID'),
            ],
          },
          {
            label: 'Pending',
            value: formatCurrency(data?.summary.pendingAmount ?? '0'),
            subtext:
              card === 'PENDING'
                ? `${data?.summary.pendingOrderCount ?? 0} orders`
                : [
                    `${data?.summary.pendingOrderCount ?? 0} orders`,
                    `${pending.pending} Pending · ${pending.advancePaid} Advance · ${pending.partialPayment} Partial`,
                  ],
            tone: 'due',
            onClick: () => selectCard('PENDING'),
            selected: card === 'PENDING',
            chips: [
              statusChip('Pending', pending.pending, 'PENDING'),
              statusChip('Advance', pending.advancePaid, 'ADVANCE_PAID'),
              statusChip('Partial', pending.partialPayment, 'PARTIAL_PAYMENT'),
            ],
          },
        ]}
      />

      <Stack spacing={2.5}>
        {/* One row per month — only worth showing when the period spans more than a month. */}
        {period.view === 'YEARLY' && (
          <MonthlyReportTable
            title="Monthly Revenue"
            columns={monthlyColumns}
            rows={data?.summary.monthly ?? []}
            getRowId={(row) => row.month}
            loading={isLoading}
            exportFileName="revenue-by-month"
            emptyDescription="No payments were received in this year."
          />
        )}

        <ReportPanel
          icon={<ReceiptLongIcon fontSize="small" />}
          title="Orders"
          action={
            card ? (
              <Chip
                size="small"
                color="primary"
                label={[CARD_LABEL[card], paymentStatus && STATUS_LABEL[paymentStatus]].filter(Boolean).join(' · ')}
                onDelete={clearSelection}
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
            exportFileName="revenue-report"
            canExport={canExport}
            emptyState={{
              icon: <ReceiptLongIcon sx={{ fontSize: 36 }} />,
              title: 'No orders in this period',
              description: card
                ? 'No orders match this selection for the chosen period. Remove the tag above to see them all.'
                : 'No order has an event date in the chosen period. Choose another month or year.',
            }}
          />
        </ReportPanel>
      </Stack>
    </>
  );
}
