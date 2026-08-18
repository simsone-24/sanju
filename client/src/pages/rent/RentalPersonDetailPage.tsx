import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PersonIcon from '@mui/icons-material/Person';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { RecordHeaderCard } from '../../components/RecordHeaderCard';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import { useRouteId } from '../../hooks/useRouteId';
import * as rentService from '../../services/rentService';
import type { RentPayment, StockOutSummary } from '../../types/rent';
import { formatCurrency, formatDate } from '../../utils/format';

/**
 * One rental person's whole rent position — "md files/Stock/stock.md" §24: the totals, then every
 * stock out and every payment behind them.
 */
export default function RentalPersonDetailPage() {
  const id = useRouteId();
  const navigate = useNavigate();
  const canView = usePermission('RENT', 'canView');

  const { data: person, isLoading } = useQuery({
    queryKey: ['rent-person', id],
    queryFn: () => rentService.getPerson(id),
    enabled: canView && Boolean(id),
  });

  const { data: stockOuts, isLoading: loadingStockOuts } = useQuery({
    queryKey: ['rent-stock-outs', { rentalPersonId: id }],
    queryFn: () => rentService.listStockOuts({ rentalPersonId: id, limit: 50 }),
    enabled: canView && Boolean(id),
  });

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['rent-payments', { rentalPersonId: id }],
    queryFn: () => rentService.listPayments({ rentalPersonId: id, limit: 50 }),
    enabled: canView && Boolean(id),
  });

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view rental persons.</Typography>;
  }
  if (isLoading) return <Typography color="text.secondary">Loading rental person…</Typography>;
  if (!person) return <Alert severity="error">Rental person not found.</Alert>;

  const stockOutColumns: DataTableColumn<StockOutSummary>[] = [
    { key: 'rentNo', header: 'Rent No', render: (row) => row.rentNo, exportValue: (row) => row.rentNo },
    {
      key: 'stockOutDate',
      header: 'Date',
      align: 'center',
      render: (row) => formatDate(row.stockOutDate),
      exportValue: (row) => formatDate(row.stockOutDate),
    },
    {
      key: 'issuedQuantity',
      header: 'Issued',
      align: 'right',
      render: (row) => row.issuedQuantity,
      exportValue: (row) => String(row.issuedQuantity),
    },
    {
      key: 'grandTotal',
      header: 'Amount',
      align: 'right',
      render: (row) => formatCurrency(row.grandTotal),
      exportValue: (row) => String(row.grandTotal),
    },
    {
      key: 'balanceAmount',
      header: 'Balance',
      align: 'right',
      render: (row) => formatCurrency(row.balanceAmount),
      exportValue: (row) => String(row.balanceAmount),
    },
    {
      key: 'returnStatus',
      header: 'Return',
      align: 'center',
      width: 150,
      render: (row) => <StatusBadge type="rentReturn" status={row.returnStatus} size="sm" />,
      exportValue: (row) => row.returnStatus,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      align: 'center',
      width: 140,
      render: (row) => <StatusBadge type="rentPayment" status={row.paymentStatus} size="sm" />,
      exportValue: (row) => row.paymentStatus,
    },
  ];

  const paymentColumns: DataTableColumn<RentPayment>[] = [
    { key: 'paymentNo', header: 'Payment No', render: (row) => row.paymentNo, exportValue: (row) => row.paymentNo },
    {
      key: 'rentNo',
      header: 'Rent No',
      render: (row) => row.stockOut.rentNo,
      exportValue: (row) => row.stockOut.rentNo,
    },
    {
      key: 'paymentDate',
      header: 'Date',
      align: 'center',
      render: (row) => formatDate(row.paymentDate),
      exportValue: (row) => formatDate(row.paymentDate),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => formatCurrency(row.amount),
      exportValue: (row) => String(row.amount),
    },
    {
      key: 'paymentMode',
      header: 'Mode',
      align: 'center',
      render: (row) => row.paymentMode.replace('_', ' '),
      exportValue: (row) => row.paymentMode,
    },
    {
      key: 'referenceNo',
      header: 'Reference',
      render: (row) => row.referenceNo ?? '—',
      exportValue: (row) => row.referenceNo ?? '',
    },
  ];

  return (
    <Box>
      <RecordHeaderCard
        icon={<PersonIcon />}
        eyebrow="Rental Person"
        title={person.name}
        badge={<StatusBadge type="active" status={person.status} />}
        facts={[
          { icon: <PhoneOutlinedIcon sx={{ fontSize: 16 }} />, label: 'Phone', value: person.phone },
          { icon: <PlaceOutlinedIcon sx={{ fontSize: 16 }} />, label: 'City', value: person.city ?? '—' },
          {
            icon: <Inventory2OutlinedIcon sx={{ fontSize: 16 }} />,
            label: 'Stock Outs',
            value: String(person.stockOutCount),
          },
        ]}
        figures={[
          { label: 'Total Rental Amount', value: formatCurrency(person.totalAmount) },
          { label: 'Total Paid', value: formatCurrency(person.paidAmount), tone: 'positive' },
          {
            label: 'Total Pending',
            value: formatCurrency(person.pendingAmount),
            tone: person.pendingAmount > 0 ? 'due' : 'positive',
          },
        ]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
          mb: 3,
        }}
      >
        <StatCard
          label="Total Rental Amount"
          value={formatCurrency(person.totalAmount)}
          icon={<ReceiptLongIcon />}
          tone="blue"
          subtext={`${person.stockOutCount} stock out(s)`}
        />
        <StatCard
          label="Total Paid"
          value={formatCurrency(person.paidAmount)}
          icon={<PaidOutlinedIcon />}
          tone="green"
        />
        <StatCard
          label="Total Pending"
          value={formatCurrency(person.pendingAmount)}
          icon={<AccountBalanceWalletIcon />}
          tone={person.pendingAmount > 0 ? 'amber' : 'slate'}
        />
      </Box>

      {(person.address || person.notes) && (
        <Paper variant="outlined" sx={{ borderRadius: '16px', p: 2.5, mb: 3 }}>
          <Stack spacing={1.5}>
            {person.address && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body2">{person.address}</Typography>
              </Box>
            )}
            {person.notes && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {person.notes}
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      )}

      <Typography variant="h4" sx={{ mb: 1.5 }}>
        Stock Out Transactions
      </Typography>
      <Box sx={{ mb: 3 }}>
        <DataTable
          columns={stockOutColumns}
          rows={stockOuts?.records ?? []}
          getRowId={(row) => row.id}
          loading={loadingStockOuts}
          page={1}
          limit={50}
          onPageChange={() => undefined}
          onLimitChange={() => undefined}
          onRowClick={(row) => navigate(`/rent/stock-outs/${row.id}`)}
          emptyMessage="No stock out transactions for this person yet."
          exportFileName={`stock-outs-${person.name}`}
        />
      </Box>

      <Typography variant="h4" sx={{ mb: 1.5 }}>
        Payment History
      </Typography>
      <DataTable
        columns={paymentColumns}
        rows={payments?.records ?? []}
        getRowId={(row) => row.id}
        loading={loadingPayments}
        page={1}
        limit={50}
        onPageChange={() => undefined}
        onLimitChange={() => undefined}
        onRowClick={(row) => navigate(`/rent/stock-outs/${row.stockOut.id}`)}
        emptyMessage="No payments recorded for this person yet."
        exportFileName={`payments-${person.name}`}
      />
    </Box>
  );
}
