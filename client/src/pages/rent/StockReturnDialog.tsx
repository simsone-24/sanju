import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../store/ToastContext';
import * as rentService from '../../services/rentService';
import type { StockOutDetail } from '../../types/rent';
import { describeApiError } from '../../utils/apiError';
import { InlinePaymentFields } from './InlinePaymentFields';
import {
  EMPTY_INLINE_PAYMENT,
  inlinePaymentError,
  toInlinePaymentInput,
  type InlinePaymentDraft,
} from './inlinePayment';

interface StockReturnDialogProps {
  open: boolean;
  stockOut: StockOutDetail | null;
  onClose: () => void;
}

/**
 * Return Stock entry — "md files/Stock/stock.md" §15, §16.
 *
 * Every issued line is listed with what it was issued at and what has already come back; the user
 * fills in Current Return only, and the Balance column updates as they type. A quantity above the
 * remaining balance is refused here with the exact maximum, and again by the server, which is the
 * authority.
 */
export function StockReturnDialog({ open, stockOut, onClose }: StockReturnDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [returnDate, setReturnDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [notes, setNotes] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [collection, setCollection] = useState<InlinePaymentDraft>({ ...EMPTY_INLINE_PAYMENT });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReturnDate(dayjs().format('YYYY-MM-DD'));
    setNotes('');
    setQuantities({});
    setCollection({ ...EMPTY_INLINE_PAYMENT });
    setError(null);
  }, [open]);

  const outstanding = stockOut?.balanceAmount ?? 0;

  const lines = useMemo(
    () => (stockOut?.items ?? []).filter((item) => item.balanceQuantity > 0),
    [stockOut],
  );

  const totalEntered = useMemo(
    () => Object.values(quantities).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [quantities],
  );

  const overReturnedLine = lines.find(
    (line) => (Number(quantities[line.id]) || 0) > line.balanceQuantity,
  );

  const mutation = useMutation({
    mutationFn: () =>
      rentService.createReturn(stockOut!.id, {
        returnDate: dayjs(returnDate).toISOString(),
        notes: notes.trim() || undefined,
        items: lines.map((line) => ({
          stockOutItemId: line.id,
          quantityReturned: Number(quantities[line.id]) || 0,
        })),
        collection: toInlinePaymentInput(collection),
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['rent-stock-out', stockOut!.id] });
      queryClient.invalidateQueries({ queryKey: ['rent-stock-outs'] });
      queryClient.invalidateQueries({ queryKey: ['rent-returns'] });
      queryClient.invalidateQueries({ queryKey: ['rent-return-summary'] });
      queryClient.invalidateQueries({ queryKey: ['rent-dashboard'] });
      // A return may also have collected money, so the payment views are stale too.
      queryClient.invalidateQueries({ queryKey: ['rent-payments'] });
      queryClient.invalidateQueries({ queryKey: ['rent-payment-summary'] });
      queryClient.invalidateQueries({ queryKey: ['rent-persons'] });
      showToast(`Return ${created.returnNo} recorded.`);
      onClose();
    },
  });

  async function handleSubmit() {
    setError(null);

    if (overReturnedLine) {
      setError(
        `"${overReturnedLine.itemName}" has only ${overReturnedLine.balanceQuantity} left to return.`,
      );
      return;
    }
    if (totalEntered <= 0) {
      setError('Enter a return quantity for at least one item.');
      return;
    }

    const paymentError = inlinePaymentError(collection, outstanding);
    if (paymentError) {
      setError(paymentError);
      return;
    }

    try {
      await mutation.mutateAsync();
    } catch (caught) {
      setError(describeApiError(caught, 'Unable to record the return. Please try again.'));
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Return Stock — {stockOut?.rentNo}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {lines.length === 0 ? (
          <Alert severity="success">Every item on this stock out has already been returned.</Alert>
        ) : (
          <>
            <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 2 }}>
              <TextField
                type="date"
                size="small"
                label="Return Date"
                sx={{ width: 190 }}
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                size="small"
                label="Notes"
                sx={{ flexGrow: 1, minWidth: 220 }}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. First return"
              />
            </Stack>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Issued
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Previously Returned
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 150 }} align="right">
                      Current Return
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Balance
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line) => {
                    const entered = Number(quantities[line.id]) || 0;
                    const overReturned = entered > line.balanceQuantity;
                    const balanceAfter = line.balanceQuantity - entered;

                    return (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {line.itemName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{line.quantity}</TableCell>
                        <TableCell align="right">{line.returnedQuantity}</TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            error={overReturned}
                            helperText={overReturned ? `Max ${line.balanceQuantity}` : undefined}
                            value={quantities[line.id] ?? ''}
                            onChange={(event) =>
                              setQuantities((current) => ({ ...current, [line.id]: event.target.value }))
                            }
                            slotProps={{
                              htmlInput: {
                                style: { textAlign: 'right' },
                                min: 0,
                                max: line.balanceQuantity,
                                step: 0.01,
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: overReturned
                                ? 'error.main'
                                : balanceAfter === 0
                                  ? 'success.main'
                                  : 'text.primary',
                            }}
                          >
                            {balanceAfter}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary">
                Returning now
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 60, textAlign: 'right' }}>
                {Math.round(totalEntered * 100) / 100}
              </Typography>
            </Stack>

            {/* Handover is when a rental is most often actually settled, so the balance can be
                collected here rather than forcing a second trip through the Payments screen. */}
            <Divider sx={{ my: 2 }} />
            <InlinePaymentFields
              value={collection}
              onChange={setCollection}
              maxAmount={outstanding}
              toggleLabel="Collect payment with this return"
              maxAmountLabel="Outstanding balance"
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={mutation.isPending || lines.length === 0 || totalEntered <= 0 || Boolean(overReturnedLine)}
        >
          {mutation.isPending ? 'Saving…' : 'Record Return'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
