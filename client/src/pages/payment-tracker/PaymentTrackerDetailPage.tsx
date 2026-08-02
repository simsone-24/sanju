import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PhoneIcon from '@mui/icons-material/Phone';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SavingsIcon from '@mui/icons-material/Savings';
import TagIcon from '@mui/icons-material/Tag';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Alert, Box, Button, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { InfoCard, InfoLine } from '../../components/InfoCard';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as paymentTrackerService from '../../services/paymentTrackerService';
import type { PaymentTrackerPayment } from '../../types/paymentTracker';
import { formatCurrency, formatDate } from '../../utils/format';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import { PaymentTrackerEditDrawer } from './PaymentTrackerEditDrawer';

// One line of the §Financial Summary block. `emphasis` marks the two figures the page is actually
// read for — what is still owed, and what has come in.
function MoneyLine({
  icon,
  label,
  value,
  emphasis,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  emphasis?: 'positive' | 'due';
}) {
  const color = emphasis === 'positive' ? 'success.main' : emphasis === 'due' ? 'warning.main' : 'text.primary';
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Box sx={{ display: 'flex', color: 'text.secondary' }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography variant="body2" sx={{ fontWeight: 700, color, whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
    </Stack>
  );
}

export default function PaymentTrackerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = usePermission('PAYMENTS', 'canEdit');
  const canExport = usePermission('PAYMENTS', 'canExport');
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['payment-tracker', 'detail', id],
    queryFn: () => paymentTrackerService.getByOrderId(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <Stack sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (isError || !data) {
    return (
      <Box>
        <PageHeader title="Payment Details" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Payment Tracker', to: '/payment-tracker' }, { label: 'Not Found' }]} />
        <Alert severity="error">This payment record could not be loaded.</Alert>
      </Box>
    );
  }

  const eventName = data.enquiry?.eventName || data.enquiry?.eventType.eventName || '—';
  const paymentStatus = data.paymentTracker?.paymentStatus ?? 'PENDING';

  const columns: DataTableColumn<PaymentTrackerPayment>[] = [
    {
      key: 'paymentDate',
      header: 'Date',
      render: (row) => formatDate(row.paymentDate),
      exportValue: (row) => formatDate(row.paymentDate),
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
    {
      key: 'referenceNumber',
      header: 'Reference',
      render: (row) => row.referenceNumber ?? '—',
      exportValue: (row) => row.referenceNumber ?? '',
    },
    {
      key: 'receivedBy',
      header: 'Received By',
      render: (row) => row.receivedBy?.fullName ?? '—',
      exportValue: (row) => row.receivedBy?.fullName ?? '',
    },
  ];

  return (
    <Box>
      <PageHeader
        title={`Payment · ${data.orderNumber}`}
        subtitle={`${data.customer.customerName} · ${eventName}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Payment Tracker', to: '/payment-tracker' },
          { label: data.orderNumber },
        ]}
        actions={
          <>
            <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => setHistoryOpen(true)}>
              Payment History
            </Button>
            <Button
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={() => navigate(`/payment-tracker/${data.id}/invoice`)}
            >
              Invoice
            </Button>
            <Button variant="outlined" onClick={() => navigate(`/orders/${data.id}`)}>
              Open Order
            </Button>
            {canEdit && (
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
                Edit Payment
              </Button>
            )}
          </>
        }
      />

      <div className="tw-mb-6 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        {/* §Order Details */}
        <InfoCard title="Order Details" icon={<ReceiptLongIcon />}>
          <InfoLine icon={<TagIcon fontSize="small" />} label="Order Number" value={data.orderNumber} />
          <InfoLine icon={<PersonIcon fontSize="small" />} label="Customer Name" value={data.customer.customerName} />
          <InfoLine icon={<PhoneIcon fontSize="small" />} label="Mobile Number" value={data.customer.mobile} />
          <InfoLine icon={<CelebrationIcon fontSize="small" />} label="Event Type" value={eventName} />
          <InfoLine
            icon={<CalendarMonthIcon fontSize="small" />}
            label="Event Date"
            value={formatDate(data.eventDate)}
          />
          <InfoLine icon={<LocationOnIcon fontSize="small" />} label="Venue" value={data.venue ?? '—'} />
          <InfoLine
            icon={<BadgeIcon fontSize="small" />}
            label="Sales Executive"
            value={data.coordinator?.fullName ?? '—'}
          />
        </InfoCard>

        {/* §Financial Summary */}
        <InfoCard
          title="Financial Summary"
          icon={<PaymentsIcon />}
          footer={
            data.paymentTracker?.remarks ? (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Remarks
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {data.paymentTracker.remarks}
                </Typography>
              </Box>
            ) : undefined
          }
        >
          <MoneyLine
            icon={<SavingsIcon fontSize="small" />}
            label="Total Budget"
            value={formatCurrency(data.totalAmount)}
          />
          <MoneyLine
            icon={<PaymentsIcon fontSize="small" />}
            label="Advance Amount"
            value={formatCurrency(data.advanceAmount)}
          />
          <MoneyLine
            icon={<TrendingUpIcon fontSize="small" />}
            label="Total Collected"
            value={formatCurrency(data.paidAmount)}
            emphasis="positive"
          />
          <Divider />
          <MoneyLine
            icon={<AccountBalanceWalletIcon fontSize="small" />}
            label="Remaining Balance"
            value={formatCurrency(data.pendingAmount)}
            emphasis={Number(data.pendingAmount) > 0 ? 'due' : undefined}
          />
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Payment Status
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <StatusBadge type="paymentTracker" status={paymentStatus} />
              {data.paymentTracker?.statusManual && (
                <Typography variant="caption" color="text.secondary">
                  set manually
                </Typography>
              )}
            </Stack>
          </Stack>
        </InfoCard>
      </div>

      <Typography variant="h4" sx={{ mb: 1.5 }}>
        Payment History
      </Typography>
      <DataTable
        columns={columns}
        rows={data.payments}
        getRowId={(row) => row.id}
        page={1}
        limit={100}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        emptyMessage="No payments collected yet."
        exportFileName={`${data.orderNumber}-payments`}
        canExport={canExport}
      />

      <PaymentTrackerEditDrawer open={editOpen} record={data} onClose={() => setEditOpen(false)} />

      <PaymentHistoryDialog open={historyOpen} record={data} onClose={() => setHistoryOpen(false)} />
    </Box>
  );
}
