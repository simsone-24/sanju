import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ViewField, ViewFieldGroup } from '../../components/ViewField';
import * as rentService from '../../services/rentService';
import { useToast } from '../../store/ToastContext';
import { RENT_PAYMENT_MODES, type StockOutSummary } from '../../types/rent';
import { describeApiError } from '../../utils/apiError';
import { formatCurrency } from '../../utils/format';
import { fromId, toId } from '../../utils/ids';
import { rentPaymentFormSchema, type RentPaymentFormValues } from '../../validation/rentSchemas';

interface RentPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Fixes the transaction being paid — used from a stock out's own page. Left out on the Payments
   * screen, where the user picks an unsettled stock out from the list instead.
   */
  stockOut?: StockOutSummary | null;
}

/** Add Payment — "md files/Stock/stock.md" §22. */
export function RentPaymentDialog({ open, onClose, stockOut }: RentPaymentDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(fromId(stockOut?.id));

  // Only transactions with something still owed are offered — paying a settled stock out is exactly
  // what the server refuses, so the picker never presents it as an option.
  const { data: unsettled } = useQuery({
    queryKey: ['rent-stock-outs', 'unsettled'],
    queryFn: () => rentService.listStockOuts({ limit: 100, paymentStatus: 'UNPAID' }),
    enabled: open && !stockOut,
  });
  const { data: partiallyPaid } = useQuery({
    queryKey: ['rent-stock-outs', 'partially-paid'],
    queryFn: () => rentService.listStockOuts({ limit: 100, paymentStatus: 'PARTIALLY_PAID' }),
    enabled: open && !stockOut,
  });

  const options = stockOut ? [stockOut] : [...(unsettled?.records ?? []), ...(partiallyPaid?.records ?? [])];
  const target = options.find((option) => String(option.id) === selectedId) ?? stockOut ?? null;
  const maxAmount = target?.balanceAmount ?? 0;

  const form = useForm<RentPaymentFormValues>({
    resolver: zodResolver(rentPaymentFormSchema),
    defaultValues: {
      stockOutId: fromId(stockOut?.id),
      amount: '',
      paymentMode: 'CASH',
      paymentDate: dayjs().format('YYYY-MM-DD'),
      referenceNo: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    setSelectedId(fromId(stockOut?.id));
    form.reset({
      stockOutId: fromId(stockOut?.id),
      amount: '',
      paymentMode: 'CASH',
      paymentDate: dayjs().format('YYYY-MM-DD'),
      referenceNo: '',
      notes: '',
    });
    // form is stable across renders; re-running on it would reset the fields mid-edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stockOut]);

  const mutation = useMutation({
    mutationFn: (values: RentPaymentFormValues) =>
      rentService.createPayment({
        stockOutId: toId(values.stockOutId),
        rentalPersonId: target!.rentalPerson.id,
        amount: Number(values.amount),
        paymentMode: values.paymentMode,
        paymentDate: values.paymentDate ? dayjs(values.paymentDate).toISOString() : undefined,
        referenceNo: values.referenceNo || undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['rent-stock-out', created.stockOut.id] });
      queryClient.invalidateQueries({ queryKey: ['rent-stock-outs'] });
      queryClient.invalidateQueries({ queryKey: ['rent-payments'] });
      queryClient.invalidateQueries({ queryKey: ['rent-payment-summary'] });
      queryClient.invalidateQueries({ queryKey: ['rent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rent-persons'] });
      showToast(`Payment ${created.paymentNo} recorded.`);
      onClose();
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    if (!target) {
      setServerError('Select a stock out.');
      return;
    }
    // Checked here rather than in the schema, against the transaction that is selected right now —
    // see the note on rentPaymentFormSchema.
    if (Number(values.amount) > maxAmount) {
      form.setError('amount', {
        message: `Amount cannot exceed the outstanding balance (${formatCurrency(maxAmount)}).`,
      });
      return;
    }
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setServerError(describeApiError(error, 'Unable to record the payment. Please try again.'));
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Payment</DialogTitle>
      <DialogContent>
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Controller
            name="stockOutId"
            control={form.control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label="Stock Out"
                required
                size="small"
                fullWidth
                disabled={Boolean(stockOut)}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                onChange={(event) => {
                  field.onChange(event);
                  setSelectedId(event.target.value);
                }}
              >
                {options.length === 0 && (
                  <MenuItem value="" disabled>
                    Nothing outstanding
                  </MenuItem>
                )}
                {options.map((option) => (
                  <MenuItem key={option.id} value={fromId(option.id)}>
                    {option.rentNo} — {option.rentalPerson.name} ({formatCurrency(option.balanceAmount)} due)
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {target && (
            <ViewFieldGroup columns={3}>
              <ViewField label="Rental Person" value={target.rentalPerson.name} />
              <ViewField label="Total Amount" value={formatCurrency(target.grandTotal)} />
              <ViewField label="Already Paid" value={formatCurrency(target.paidAmount)} tone="success" />
              <ViewField label="Current Balance" value={formatCurrency(target.balanceAmount)} tone="warning" />
            </ViewFieldGroup>
          )}

          <Stack direction="row" spacing={2}>
            <TextField
              label="Payment Amount"
              type="number"
              required
              size="small"
              fullWidth
              error={Boolean(form.formState.errors.amount)}
              helperText={form.formState.errors.amount?.message}
              slotProps={{ htmlInput: { min: 0, max: maxAmount, step: 0.01 } }}
              {...form.register('amount')}
            />
            {/* Controller, not register: MUI's Select is not a native input, so a registered one
                keeps whatever was last picked when the form is reset on reopen while RHF's state
                goes back to the default — the two then disagree silently. */}
            <Controller
              name="paymentMode"
              control={form.control}
              render={({ field }) => (
                <TextField {...field} select label="Payment Mode" required size="small" fullWidth>
                  {RENT_PAYMENT_MODES.map((mode) => (
                    <MenuItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              type="date"
              label="Payment Date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              {...form.register('paymentDate')}
            />
            <TextField label="Reference Number" size="small" fullWidth {...form.register('referenceNo')} />
          </Stack>

          <TextField label="Notes" size="small" fullWidth multiline minRows={2} {...form.register('notes')} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={mutation.isPending || !target}>
          {mutation.isPending ? 'Saving…' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
