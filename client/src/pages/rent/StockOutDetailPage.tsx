import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditIcon from '@mui/icons-material/Edit';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PrintIcon from '@mui/icons-material/Print';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { RecordHeaderCard } from '../../components/RecordHeaderCard';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import { useRouteId } from '../../hooks/useRouteId';
import * as rentService from '../../services/rentService';
import { useToast } from '../../store/ToastContext';
import type { StockOutDetail } from '../../types/rent';
import { describeApiError } from '../../utils/apiError';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { RentPaymentDialog } from './RentPaymentDialog';
import { StockReturnDialog } from './StockReturnDialog';

/** Stock Out view — "md files/Stock/stock.md" §12, §18, §25. */
export default function StockOutDetailPage() {
  const id = useRouteId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const canView = usePermission('RENT', 'canView');
  const canCreate = usePermission('RENT', 'canCreate');
  const canEdit = usePermission('RENT', 'canEdit');
  const canDelete = usePermission('RENT', 'canDelete');
  const canPrint = usePermission('RENT', 'canPrint');

  const [returnOpen, setReturnOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: stockOut, isLoading } = useQuery({
    queryKey: ['rent-stock-out', id],
    queryFn: () => rentService.getStockOut(id),
    enabled: canView && Boolean(id),
  });

  const cancelMutation = useMutation({
    mutationFn: () => rentService.cancelStockOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rent-stock-out', id] });
      queryClient.invalidateQueries({ queryKey: ['rent-stock-outs'] });
      queryClient.invalidateQueries({ queryKey: ['rent-dashboard'] });
      showToast('Stock out cancelled.');
      setCancelOpen(false);
    },
    onError: (error) => setActionError(describeApiError(error, 'Unable to cancel the stock out.')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => rentService.deleteStockOut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rent-stock-outs'] });
      queryClient.invalidateQueries({ queryKey: ['rent-dashboard'] });
      showToast('Stock out deleted.');
      navigate('/rent/stock-outs');
    },
    onError: (error) => setActionError(describeApiError(error, 'Unable to delete the stock out.')),
  });

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view stock outs.</Typography>;
  }
  if (isLoading) return <Typography color="text.secondary">Loading stock out…</Typography>;
  if (!stockOut) return <Alert severity="error">Stock out not found.</Alert>;

  const cancelled = stockOut.status === 'CANCELLED';
  const fullyReturned = stockOut.returnStatus === 'RETURNED';
  const settled = stockOut.balanceAmount <= 0;
  const hasHistory = stockOut.returns.length > 0 || stockOut.payments.length > 0;

  return (
    <Box>
      <RecordHeaderCard
        icon={<Inventory2Icon />}
        eyebrow="Stock Out"
        title={stockOut.rentNo}
        badge={
          <Stack direction="row" spacing={1}>
            <StatusBadge type="rentReturn" status={stockOut.returnStatus} />
            <StatusBadge type="rentPayment" status={stockOut.paymentStatus} />
            {cancelled && <StatusBadge type="stockOut" status={stockOut.status} />}
          </Stack>
        }
        actions={
          <>
            {canEdit && !cancelled && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/rent/stock-outs/${stockOut.id}/edit`)}
              >
                Edit
              </Button>
            )}
            {canCreate && !cancelled && !fullyReturned && (
              <Button
                size="small"
                variant="contained"
                startIcon={<AssignmentReturnIcon />}
                onClick={() => setReturnOpen(true)}
              >
                Return Stock
              </Button>
            )}
            {canCreate && !cancelled && !settled && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<PaymentsIcon />}
                onClick={() => setPaymentOpen(true)}
              >
                Add Payment
              </Button>
            )}
            {canPrint && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => navigate(`/rent/stock-outs/${stockOut.id}/print`)}
              >
                Print / PDF
              </Button>
            )}
            {canDelete && !cancelled && hasHistory && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<EventBusyIcon />}
                onClick={() => setCancelOpen(true)}
              >
                Cancel
              </Button>
            )}
            {canDelete && !hasHistory && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            )}
          </>
        }
        facts={[
          {
            icon: <PersonOutlineIcon sx={{ fontSize: 16 }} />,
            label: 'Rental Person',
            value: stockOut.rentalPerson.name,
          },
          { icon: <PhoneOutlinedIcon sx={{ fontSize: 16 }} />, label: 'Phone', value: stockOut.rentalPerson.phone },
          {
            icon: <CalendarMonthIcon sx={{ fontSize: 16 }} />,
            label: 'Stock Out Date',
            value: formatDate(stockOut.stockOutDate),
          },
          {
            icon: <CalendarMonthIcon sx={{ fontSize: 16 }} />,
            label: 'Expected Return',
            value: formatDate(stockOut.expectedReturnDate),
          },
        ]}
        figures={[
          { label: 'Grand Total', value: formatCurrency(stockOut.grandTotal) },
          { label: 'Paid', value: formatCurrency(stockOut.paidAmount), tone: 'positive' },
          {
            label: 'Balance',
            value: formatCurrency(stockOut.balanceAmount),
            tone: stockOut.balanceAmount > 0 ? 'due' : 'positive',
          },
        ]}
      />

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {cancelled && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This stock out has been cancelled. It is excluded from every dashboard total and report, but its
          return and payment history is kept on record.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' } }}>
        <Stack spacing={2}>
          <ItemsCard stockOut={stockOut} />
          <ReturnHistoryCard stockOut={stockOut} />
          <PaymentHistoryCard stockOut={stockOut} />
        </Stack>

        <Stack spacing={2}>
          <SummaryCard stockOut={stockOut} />
          {stockOut.notes && (
            <Paper variant="outlined" sx={{ borderRadius: '16px', p: 2.5 }}>
              <Typography variant="h4" sx={{ mb: 1 }}>
                Notes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                {stockOut.notes}
              </Typography>
            </Paper>
          )}
          <Paper variant="outlined" sx={{ borderRadius: '16px', p: 2.5 }}>
            <Typography variant="h4" sx={{ mb: 1.5 }}>
              Record
            </Typography>
            <Stack spacing={1}>
              <MetaLine label="Created by" value={stockOut.createdBy?.fullName ?? '—'} />
              <MetaLine label="Created on" value={formatDateTime(stockOut.createdAt)} />
              <MetaLine label="Last updated" value={formatDateTime(stockOut.updatedAt)} />
            </Stack>
          </Paper>
        </Stack>
      </Box>

      <StockReturnDialog open={returnOpen} stockOut={stockOut} onClose={() => setReturnOpen(false)} />
      <RentPaymentDialog open={paymentOpen} stockOut={stockOut} onClose={() => setPaymentOpen(false)} />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel Stock Out?"
        message={`${stockOut.rentNo} will be excluded from all lists, dashboards and reports. Its returns and payments stay on record and it cannot be reinstated.`}
        confirmLabel="Cancel Stock Out"
        cancelLabel="Keep"
        danger
        loading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onClose={() => setCancelOpen(false)}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Stock Out?"
        message={`Delete ${stockOut.rentNo}? This cannot be undone.`}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => setDeleteOpen(false)}
      />
    </Box>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function ItemsCard({ stockOut }: { stockOut: StockOutDetail }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 2.5 } }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Rental Items
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Issued
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Returned
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Balance
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Rate
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Amount
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockOut.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.itemName}
                  </Typography>
                </TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{item.returnedQuantity}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: item.balanceQuantity > 0 ? 'warning.main' : 'success.main' }}
                  >
                    {item.balanceQuantity}
                  </Typography>
                </TableCell>
                <TableCell align="right">{formatCurrency(item.rate)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function ReturnHistoryCard({ stockOut }: { stockOut: StockOutDetail }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Return History</Typography>
        <Chip size="small" label={stockOut.returns.length} sx={{ fontWeight: 700 }} />
      </Stack>

      {stockOut.returns.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nothing has been returned against this stock out yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {stockOut.returns.map((entry) => (
            <Box
              key={entry.id}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', p: 1.75 }}
            >
              <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {entry.returnNo}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(entry.returnDate)} · {entry.totalReturned} item(s)
                  {entry.createdBy ? ` · ${entry.createdBy.fullName}` : ''}
                </Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                {entry.items
                  .filter((item) => item.quantityReturned > 0)
                  .map((item) => (
                    <Chip
                      key={item.id}
                      size="small"
                      variant="outlined"
                      label={`${item.itemName} × ${item.quantityReturned}`}
                    />
                  ))}
              </Stack>
              {entry.notes && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {entry.notes}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function PaymentHistoryCard({ stockOut }: { stockOut: StockOutDetail }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Payment History</Typography>
        <Chip size="small" label={stockOut.payments.length} sx={{ fontWeight: 700 }} />
      </Stack>

      {stockOut.payments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No payment has been collected yet.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Payment No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockOut.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{payment.paymentNo}</TableCell>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>{payment.paymentMode.replace('_', ' ')}</TableCell>
                  <TableCell>{payment.referenceNo ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

function SummaryCard({ stockOut }: { stockOut: StockOutDetail }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: '16px', p: 2.5 }}>
      <Typography variant="h4" sx={{ mb: 1.5 }}>
        Financial Summary
      </Typography>
      <Stack spacing={1}>
        <MetaLine label="Subtotal" value={formatCurrency(stockOut.subtotal)} />
        <MetaLine
          label={stockOut.discountPercent > 0 ? `Discount (${stockOut.discountPercent}%)` : 'Discount'}
          value={`− ${formatCurrency(stockOut.discount)}`}
        />
        <MetaLine label="Additional Charges" value={`+ ${formatCurrency(stockOut.additionalCharges)}`} />
        <Divider />
        <MetaLine label="Grand Total" value={formatCurrency(stockOut.grandTotal)} />
        <MetaLine label="Paid" value={formatCurrency(stockOut.paidAmount)} />
        <MetaLine label="Balance" value={formatCurrency(stockOut.balanceAmount)} />
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h4" sx={{ mb: 1.5 }}>
        Return Summary
      </Typography>
      <Stack spacing={1}>
        <MetaLine label="Total Issued" value={String(stockOut.issuedQuantity)} />
        <MetaLine label="Total Returned" value={String(stockOut.returnedQuantity)} />
        <MetaLine label="Total Balance" value={String(stockOut.pendingQuantity)} />
      </Stack>
      <Box sx={{ mt: 1.5 }}>
        <StatusBadge type="rentReturn" status={stockOut.returnStatus} />
      </Box>
    </Paper>
  );
}
