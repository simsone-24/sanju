import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import LaunchIcon from '@mui/icons-material/Launch';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotesIcon from '@mui/icons-material/Notes';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PhoneIcon from '@mui/icons-material/Phone';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {
  Alert,
  Box,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { ProgressDonut } from '../../components/ProgressDonut';
import { RecordHeaderCard } from '../../components/RecordHeaderCard';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as paymentTrackerService from '../../services/paymentTrackerService';
import type { PaymentTrackerPayment } from '../../types/paymentTracker';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';
import { PaymentTrackerEditDialog } from './PaymentTrackerEditDialog';

// One figure in the collection summary — the same shape the Order Details payment card uses, so
// money reads identically in both modules.
function MoneyLine({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'due' }) {
  const color = tone === 'positive' ? 'success.dark' : tone === 'due' ? 'error.dark' : 'text.primary';
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  );
}

function DetailSkeleton() {
  return (
    <Box>
      <Skeleton variant="rounded" height={170} sx={{ borderRadius: '16px', mb: 2 }} />
      <Skeleton variant="rounded" height={420} sx={{ borderRadius: '16px' }} />
    </Box>
  );
}

/**
 * Payment Tracker detail — one order's money, laid out like Order Details so the two read as one
 * product: the record's header strip on top, the receipts that make up the balance on the left,
 * and where collection stands on the right.
 */
export default function PaymentTrackerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = usePermission('PAYMENTS', 'canEdit');
  const canExport = usePermission('PAYMENTS', 'canExport');
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['payment-tracker', 'detail', id],
    queryFn: () => paymentTrackerService.getByOrderId(id!),
    enabled: Boolean(id),
  });

  const breadcrumbs = [
    { label: 'Dashboard', to: '/' },
    { label: 'Payment Tracker', to: '/payment-tracker' },
    { label: data?.orderNumber ?? 'Payment' },
  ];

  if (isLoading) return <DetailSkeleton />;

  if (isError || !data) {
    return (
      <Box>
        <Breadcrumbs items={breadcrumbs} />
        <Alert severity="error">This payment record could not be loaded.</Alert>
      </Box>
    );
  }

  const eventName = data.enquiry?.eventName || data.enquiry?.eventType.eventName || '—';
  const paymentStatus = data.paymentTracker?.paymentStatus ?? 'PENDING';
  const budget = Number(data.totalAmount);
  const collectedPercent = budget > 0 ? Math.round((Number(data.paidAmount) / budget) * 100) : 0;

  function closeActions() {
    setActionsAnchor(null);
  }

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
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(row.amount)}
        </Typography>
      ),
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
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1 }}
      >
        <Breadcrumbs items={breadcrumbs} />
        <Button
          size="small"
          variant="outlined"
          endIcon={<MoreVertIcon />}
          aria-haspopup="menu"
          aria-expanded={actionsAnchor ? 'true' : undefined}
          onClick={(event) => setActionsAnchor(event.currentTarget)}
          sx={{ mb: 1.25 }}
        >
          Actions
        </Button>
        <Menu anchorEl={actionsAnchor} open={Boolean(actionsAnchor)} onClose={closeActions}>
          <MenuItem
            onClick={() => {
              closeActions();
              setHistoryOpen(true);
            }}
          >
            <ListItemIcon>
              <HistoryIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Payment History" secondary="Every change made to this record" />
          </MenuItem>
          {/* The tracker is keyed by the order's id, so its own id is the order's — see AppRoutes. */}
          <MenuItem
            onClick={() => {
              closeActions();
              navigate(`/orders/${data.id}`);
            }}
          >
            <ListItemIcon>
              <LaunchIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={`Open order ${data.orderNumber}`} />
          </MenuItem>
        </Menu>
      </Stack>

      <RecordHeaderCard
        icon={<AccountBalanceWalletIcon />}
        eyebrow="Payment Tracker"
        title={data.orderNumber}
        badge={<StatusBadge type="paymentTracker" status={paymentStatus} />}
        actions={
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={() => navigate(`/payment-tracker/${data.id}/invoice`)}
            >
              Invoice
            </Button>
            {canEdit && (
              <Button size="small" variant="contained" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
                Edit Payment
              </Button>
            )}
          </>
        }
        facts={[
          {
            icon: <PersonOutlinedIcon sx={{ fontSize: 16 }} />,
            label: 'Customer',
            value: data.customer.customerName,
          },
          { icon: <PhoneIcon sx={{ fontSize: 16 }} />, label: 'Mobile', value: data.customer.mobile || '—' },
          { icon: <CelebrationIcon sx={{ fontSize: 16 }} />, label: 'Event Type', value: eventName },
          {
            icon: <CalendarMonthIcon sx={{ fontSize: 16 }} />,
            label: 'Event Date',
            value: formatDate(data.eventDate),
          },
          { icon: <LocationOnIcon sx={{ fontSize: 16 }} />, label: 'Venue', value: data.venue || '—' },
          {
            icon: <BadgeIcon sx={{ fontSize: 16 }} />,
            label: 'Sales Executive',
            value: data.coordinator?.fullName ?? 'Unassigned',
          },
        ]}
        figures={[
          { label: 'Total Budget', value: formatCurrency(data.totalAmount) },
          { label: 'Collected', value: formatCurrency(data.paidAmount), tone: 'positive' },
          { label: 'Balance', value: formatCurrency(data.pendingAmount), tone: 'due' },
        ]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(320px, 1fr)' },
        }}
      >
        <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 3 }, minWidth: 0 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2.5 }}>
            <ReceiptLongIcon fontSize="small" sx={{ color: 'primary.main' }} />
            <Typography variant="h4" component="h2">
              Collections ({data.payments.length})
            </Typography>
          </Stack>
          {/* disableContainer: the card is already the surface — a second bordered box inside it
              would double the frame. */}
          <DataTable
            disableContainer
            columns={columns}
            rows={data.payments}
            getRowId={(row) => row.id}
            page={1}
            limit={100}
            onPageChange={() => {}}
            onLimitChange={() => {}}
            exportFileName={`${data.orderNumber}-payments`}
            canExport={canExport}
            emptyState={{
              icon: <ReceiptLongIcon sx={{ fontSize: 36 }} />,
              title: 'No collections yet',
              description: 'Receipts recorded against this order will appear here.',
            }}
          />
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 3 }, minWidth: 0 }}>
          <Typography variant="h4" component="h2" sx={{ mb: 2.5 }}>
            Collection Summary
          </Typography>

          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}>
            <ProgressDonut percent={collectedPercent} caption="Collected" size={124} />
            <Stack spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
              <MoneyLine label="Total Budget" value={formatCurrency(data.totalAmount)} />
              <MoneyLine label="Advance Amount" value={formatCurrency(data.advanceAmount)} />
              <MoneyLine label="Total Collected" value={formatCurrency(data.paidAmount)} tone="positive" />
              <MoneyLine label="Remaining Balance" value={formatCurrency(data.pendingAmount)} tone="due" />
            </Stack>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h4" component="h2" sx={{ mb: 2.5 }}>
            Record
          </Typography>
          <Stack spacing={1.75}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Payment Status
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <StatusBadge type="paymentTracker" status={paymentStatus} />
                {/* Worth saying: a pinned status no longer follows the receipts below it. */}
                {data.paymentTracker?.statusManual && (
                  <Typography variant="caption" color="text.secondary">
                    set manually
                  </Typography>
                )}
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatDateTime(data.updatedAt)}
              </Typography>
            </Stack>
          </Stack>

          {data.paymentTracker?.remarks && (
            <Box sx={{ mt: 2.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary', mb: 0.5 }}>
                <NotesIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption">Remarks</Typography>
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {data.paymentTracker.remarks}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      <PaymentTrackerEditDialog open={editOpen} record={data} onClose={() => setEditOpen(false)} />

      <PaymentHistoryDialog open={historyOpen} record={data} onClose={() => setHistoryOpen(false)} />
    </Box>
  );
}
