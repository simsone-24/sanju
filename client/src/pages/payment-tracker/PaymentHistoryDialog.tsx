import CloseIcon from '@mui/icons-material/Close';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import * as paymentTrackerService from '../../services/paymentTrackerService';
import type { PaymentTrackerRecord } from '../../types/paymentTracker';
import { formatCurrency, formatDate } from '../../utils/format';

interface PaymentHistoryDialogProps {
  open: boolean;
  /** The row whose receipts to show — also names the order in the dialog header. */
  record: PaymentTrackerRecord | null;
  onClose: () => void;
}

// "payment/payment.md" §Actions — the receipts behind the Collected figure, as a plain table.
// Opened from the list row, the detail page and the Edit form.
export function PaymentHistoryDialog({ open, record, onClose }: PaymentHistoryDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    data: payments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['payment-tracker', 'history', record?.id],
    queryFn: () => paymentTrackerService.getHistory(record!.id),
    enabled: open && Boolean(record),
  });

  const total = (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <ReceiptLongIcon fontSize="small" color="primary" />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" component="div" noWrap>
                Payment History
              </Typography>
              {record && (
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                  {record.orderNumber} · {record.customer.customerName}
                </Typography>
              )}
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small" aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {isLoading && (
          <Stack sx={{ alignItems: 'center', py: 5 }}>
            <CircularProgress size={28} />
          </Stack>
        )}

        {isError && (
          <Alert severity="error" sx={{ m: 3 }}>
            Unable to load the payment history.
          </Alert>
        )}

        {payments && payments.length === 0 && (
          <Stack spacing={1} sx={{ alignItems: 'center', py: 5 }}>
            <ReceiptLongIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary">
              No payments collected yet.
            </Typography>
          </Stack>
        )}

        {payments && payments.length > 0 && (
          // Seven columns will not fit a phone, so the table scrolls inside its own container
          // rather than forcing the dialog to scroll sideways.
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Receipt No</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Received By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{payment.paymentType}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{payment.paymentMethod}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{payment.receiptNumber}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{payment.referenceNumber ?? '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{payment.receivedBy?.fullName ?? '—'}</TableCell>
                  </TableRow>
                ))}

                {/* Total sits in the table itself so it lines up under the Amount column. */}
                <TableRow>
                  <TableCell colSpan={2} sx={{ fontWeight: 700, borderBottom: 'none' }}>
                    Total Collected
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap', borderBottom: 'none' }}>
                    {formatCurrency(total)}
                  </TableCell>
                  <TableCell colSpan={4} sx={{ borderBottom: 'none' }} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
