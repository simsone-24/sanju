import { zodResolver } from '@hookform/resolvers/zod';
import HistoryIcon from '@mui/icons-material/History';
import { Alert, Box, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { DatePickerField } from '../../components/DatePickerField';
import { FormDialog } from '../../components/FormDialog';
import { resolveStatusConfig } from '../../components/statusConfig';
import { ViewField } from '../../components/ViewField';
import * as paymentTrackerService from '../../services/paymentTrackerService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type {
  PaymentTrackerRecord,
  PaymentTrackerStatus,
  UpdatePaymentTrackerInput,
} from '../../types/paymentTracker';
import { formatCurrency } from '../../utils/format';
import {
  PAYMENT_STATUS_CHOICES,
  updatePaymentTrackerSchema,
  type UpdatePaymentTrackerFormValues,
} from '../../validation/paymentTrackerSchemas';
import { PaymentHistoryDialog } from './PaymentHistoryDialog';

const PAYMENT_METHODS = ['CASH', 'UPI', 'BANK', 'CARD', 'CHEQUE'] as const;

interface PaymentTrackerEditDialogProps {
  open: boolean;
  record: PaymentTrackerRecord | null;
  onClose: () => void;
}

// The form's status dropdown value: either "AUTO" (status follows the payments) or a pinned status.
type StatusChoice = (typeof PAYMENT_STATUS_CHOICES)[number];

function currentStatusChoice(record: PaymentTrackerRecord | null): StatusChoice {
  if (!record?.paymentTracker) return 'AUTO';
  return record.paymentTracker.statusManual ? record.paymentTracker.paymentStatus : 'AUTO';
}

/**
 * §Edit Payment — a centered popup (FormDialog) to record a collection against an order.
 *
 * Budget is set once at order creation and isn't editable here (there is no field for it anywhere
 * in the app) — Customer/Budget/Collected/Pending sit up top as a plain read-only summary, and
 * everything below is the actual form: the amount coming in now, how it was paid, and the
 * resulting status/notes.
 */
export function PaymentTrackerEditDialog({ open, record, onClose }: PaymentTrackerEditDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const collectedSoFar = Number(record?.paidAmount ?? 0);
  const storedBudget = Number(record?.totalAmount ?? 0);
  const pendingAmount = Number(record?.pendingAmount ?? storedBudget - collectedSoFar);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdatePaymentTrackerFormValues>({
    resolver: zodResolver(updatePaymentTrackerSchema(pendingAmount)),
    defaultValues: {
      collectedAmount: '',
      paymentMethod: 'CASH',
      // Money is nearly always recorded on the day it comes in, so the field opens on today rather
      // than empty. It stays clearable for a receipt being entered late.
      paymentDate: dayjs().format('YYYY-MM-DD'),
      paymentStatus: 'AUTO',
      remarks: '',
    },
  });

  // The dialog is mounted once and reused for whichever row is being edited, so the form is
  // refilled whenever that row changes rather than on mount.
  useEffect(() => {
    if (!record) return;
    setServerError(null);
    reset({
      collectedAmount: '',
      paymentMethod: 'CASH',
      paymentDate: dayjs().format('YYYY-MM-DD'),
      paymentStatus: currentStatusChoice(record),
      remarks: record.paymentTracker?.remarks ?? '',
    });
  }, [record, reset]);

  // §Auto Calculation "Balance = Budget - Collected", shown live against what is currently typed
  // rather than only after saving.
  const watchedCollected = Number(watch('collectedAmount') || 0);
  const projectedCollected = collectedSoFar + (Number.isFinite(watchedCollected) ? watchedCollected : 0);
  const projectedPending = pendingAmount - (Number.isFinite(watchedCollected) ? watchedCollected : 0);

  const updateMutation = useMutation({
    mutationFn: (input: UpdatePaymentTrackerInput) => paymentTrackerService.update(record!.id, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['payment-tracker'] });
      // A collection also moves the order's own paid/pending amounts (not its status — that is the
      // Orders module's alone), so the Orders module has to be refreshed alongside the tracker.
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', updated.id] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', updated.id] });
      showToast(`Payment details updated for order "${updated.orderNumber}".`, 'success');
      onClose();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!record) return;
    setServerError(null);

    const statusChoice = values.paymentStatus;
    const previousStatusChoice = currentStatusChoice(record);
    const nextRemarks = values.remarks ?? '';

    const input: UpdatePaymentTrackerInput = {
      ...(values.collectedAmount
        ? {
            collected: {
              amount: Number(values.collectedAmount),
              paymentMethod: values.paymentMethod,
              paymentDate: values.paymentDate || undefined,
            },
          }
        : {}),
      // Sent only on an actual change, so simply reopening and saving the form never writes a
      // spurious "status changed" entry into the activity log.
      ...(statusChoice !== previousStatusChoice
        ? { paymentStatus: statusChoice === 'AUTO' ? null : (statusChoice as PaymentTrackerStatus) }
        : {}),
      ...(nextRemarks !== (record.paymentTracker?.remarks ?? '') ? { remarks: nextRemarks } : {}),
    };

    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }

    try {
      await updateMutation.mutateAsync(input);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) setServerError(error.response.data.message);
      else setServerError('Unable to update the payment details. Please try again.');
    }
  });

  return (
    <>
      <FormDialog
        open={open}
        title="Edit Payment"
        subtitle={record ? record.orderNumber : undefined}
        onClose={onClose}
        onSave={onSubmit}
        saving={updateMutation.isPending}
        maxWidth={480}
      >
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Stack spacing={2.5}>
          {/* View only — Customer, Budget, Collected, Pending. Nothing here is editable; the History
              icon opens the receipts behind the Collected figure. */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {record?.customer.customerName ?? '—'}
              </Typography>
              <Tooltip title="Payment history">
                <span>
                  <IconButton size="small" onClick={() => setHistoryOpen(true)} disabled={!record}>
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              <ViewField label="Budget Amount" value={formatCurrency(storedBudget)} />
              <ViewField label="Collected" value={formatCurrency(collectedSoFar)} />
              <ViewField label="Pending" value={formatCurrency(pendingAmount)} tone={pendingAmount > 0 ? 'warning' : undefined} />
            </Box>
          </Box>

          <TextField
            label="Collected Amount"
            type="number"
            fullWidth
            placeholder="Amount received now"
            error={Boolean(errors.collectedAmount)}
            helperText={
              errors.collectedAmount?.message ??
              (watchedCollected > 0
                ? `Collected becomes ${formatCurrency(projectedCollected)} · Pending becomes ${formatCurrency(projectedPending)}`
                : 'Leave blank if nothing is being collected now.')
            }
            {...register('collectedAmount')}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Controller, not register: MUI's Select keeps its own display state, so bound by ref
                alone it opens blank instead of on the default and holds the last pick across the
                reset above — the field and react-hook-form then disagree silently. */}
            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Payment Method" fullWidth>
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="paymentDate"
              control={control}
              render={({ field }) => (
                <DatePickerField
                  label="Payment Date"
                  margin="none"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                  maxDate={dayjs()}
                />
              )}
            />
          </Box>

          {/* Same reason as Payment Method — and it matters more here: this one is reset to the
              edited row's own status, so bound by ref it would still show the previously edited
              row's while react-hook-form holds the right one. */}
          <Controller
            name="paymentStatus"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Payment Status"
                fullWidth
                helperText="Automatic follows the payments. Choosing a status pins it until you switch back."
              >
                {PAYMENT_STATUS_CHOICES.map((choice) => (
                  <MenuItem key={choice} value={choice}>
                    {choice === 'AUTO' ? 'Automatic (from payments)' : resolveStatusConfig('paymentTracker', choice).label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={2}
            error={Boolean(errors.remarks)}
            helperText={errors.remarks?.message}
            {...register('remarks')}
          />
        </Stack>
      </FormDialog>

      <PaymentHistoryDialog open={historyOpen} record={record} onClose={() => setHistoryOpen(false)} />
    </>
  );
}
