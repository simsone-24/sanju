import { CircularProgress, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import * as paymentTrackerService from '../../services/paymentTrackerService';
import type { BudgetChange } from '../../types/paymentTracker';
import { formatCurrency, formatDateTime } from '../../utils/format';

interface BudgetChangeHistoryProps {
  orderId: number;
  /** Drop the table's own frame when it already sits inside a card. */
  disableContainer?: boolean;
}

const columns: DataTableColumn<BudgetChange>[] = [
  { key: 'performedAt', header: 'Date', render: (row) => formatDateTime(row.performedAt) },
  { key: 'from', header: 'Old Budget', align: 'right', render: (row) => formatCurrency(row.from) },
  { key: 'to', header: 'New Budget', align: 'right', render: (row) => formatCurrency(row.to) },
  {
    key: 'change',
    header: 'Change',
    align: 'right',
    render: (row) => `${row.to >= row.from ? '+' : '-'} ${formatCurrency(Math.abs(row.to - row.from))}`,
  },
  { key: 'reason', header: 'Reason', render: (row) => row.reason },
  { key: 'performedBy', header: 'Changed By', render: (row) => row.performedBy?.fullName ?? '—' },
];

// Every budget change on an order with the reason given — read from the Payment Tracker's own
// endpoint (Payments → View), so it works for roles that can see payments but not orders. The key
// sits under 'payment-tracker', so saving an Adjust Budget refreshes it with the rest of the tracker.
export function BudgetChangeHistory({ orderId, disableContainer }: BudgetChangeHistoryProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['payment-tracker', 'budget-changes', orderId],
    queryFn: () => paymentTrackerService.getBudgetChanges(orderId),
  });

  if (isLoading) return <CircularProgress size={24} />;
  if (isError) {
    return (
      <Typography variant="body2" color="error">
        Unable to load the budget changes.
      </Typography>
    );
  }

  return (
    <DataTable
      disableContainer={disableContainer}
      columns={columns}
      rows={data ?? []}
      getRowId={(row) => row.id}
      page={1}
      limit={100}
      onPageChange={() => {}}
      onLimitChange={() => {}}
      emptyMessage="The budget has not been changed."
    />
  );
}
