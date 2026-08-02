import { zodResolver } from '@hookform/resolvers/zod';
import HistoryIcon from '@mui/icons-material/History';
import { Alert, Box, Divider, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { DatePickerField } from '../../components/DatePickerField';
import { FormDrawer } from '../../components/FormDrawer';
import { resolveStatusConfig } from '../../components/statusConfig';
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

interface PaymentTrackerEditDrawerProps {
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
 * §Edit Payment — budget, a collection to record, the payment status and remarks, saved together.
 *
 * The Collected box takes the amount received NOW, not a replacement total: the running total sits
 * beneath it, so what the field means is unambiguous, and every entry becomes its own receipt in
 * the payment history the icon opens.
 */
export function PaymentTrackerEditDrawer({ open, record, onClose }: PaymentTrackerEditDrawerProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const collectedSoFar = Number(record?.paidAmount ?? 0);
  const storedBudget = Number(record?.totalAmount ?? 0);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdatePaymentTrackerFormValues>({
    resolver: zodResolver(updatePaymentTrackerSchema(collectedSoFar)),
    defaultValues: {
      budgetAmount: '',
      collectedAmount: '',
      paymentMethod: 'CASH',
      paymentDate: '',
      referenceNumber: '',
      paymentStatus: 'AUTO',
      remarks: '',
    },
  });

  // The drawer is mounted once and reused for whichever row is being edited, so the form is
  // refilled whenever that row changes rather than on mount.
  useEffect(() => {
    if (!record) return;
    setServerError(null);
    reset({
      budgetAmount: String(storedBudget),
      collectedAmount: '',
      paymentMethod: 'CASH',
      paymentDate: '',
      referenceNumber: '',
      paymentStatus: currentStatusChoice(record),
      remarks: record.paymentTracker?.remarks ?? '',
    });
  }, [record, reset, storedBudget]);

  // §Auto Calculation "Balance = Budget - Collected", shown live against what is currently typed
  // rather than only after saving.
  const watchedBudget = Number(watch('budgetAmount') || 0);
  const watchedCollected = Number(watch('collectedAmount') || 0);
  const projectedCollected = collectedSoFar + (Number.isFinite(watchedCollected) ? watchedCollected : 0);
  const projectedBalance = (Number.isFinite(watchedBudget) ? watchedBudget : 0) - projectedCollected;

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

    const nextBudget = Number(values.budgetAmount);
    const statusChoice = values.paymentStatus;
    const previousStatusChoice = currentStatusChoice(record);
    const nextRemarks = values.remarks ?? '';

    const input: UpdatePaymentTrackerInput = {
      ...(nextBudget !== storedBudget ? { budgetAmount: nextBudget } : {}),
      ...(values.collectedAmount
        ? {
            collected: {
              amount: Number(values.collectedAmount),
              paymentMethod: values.paymentMethod,
              paymentDate: values.paymentDate || undefined,
              referenceNumber: values.referenceNumber || undefined,
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
      <FormDrawer
        open={open}
        title="Edit Payment"
        subtitle={record ? `${record.orderNumber} · ${record.customer.customerName}` : undefined}
        onClose={onClose}
        onSave={onSubmit}
        saving={updateMutation.isPending}
        width={520}
      >
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <TextField
          label="Budget Amount"
          type="number"
          fullWidth
          margin="normal"
          error={Boolean(errors.budgetAmount)}
          helperText={errors.budgetAmount?.message}
          {...register('budgetAmount')}
        />

        <Divider sx={{ my: 2.5 }}>
          <Typography variant="caption" color="text.secondary">
            RECORD A COLLECTION
          </Typography>
        </Divider>

        <TextField
          label="Collected Amount"
          type="number"
          fullWidth
          placeholder="Amount received now"
          error={Boolean(errors.collectedAmount)}
          helperText={errors.collectedAmount?.message ?? 'Leave blank if no money is being collected in this save.'}
          {...register('collectedAmount')}
        />

        {/* The running total sits directly under the input so the box is unmistakably "amount
            received now" rather than "new total", with the receipts one click away. */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 1, mb: 0.5 }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Total Collected
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatCurrency(collectedSoFar)}
              {watchedCollected > 0 && (
                <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
                  {' '}
                  → {formatCurrency(projectedCollected)}
                </Box>
              )}
            </Typography>
          </Box>
          <Tooltip title="Payment history">
            <span>
              <IconButton size="small" onClick={() => setHistoryOpen(true)} disabled={!record}>
                <HistoryIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Typography variant="caption" color={projectedBalance < 0 ? 'error.main' : 'text.secondary'}>
          Balance after saving: {formatCurrency(projectedBalance)}
        </Typography>

        <TextField select label="Payment Method" fullWidth margin="normal" {...register('paymentMethod')}>
          {PAYMENT_METHODS.map((method) => (
            <MenuItem key={method} value={method}>
              {method}
            </MenuItem>
          ))}
        </TextField>

        <Controller
          name="paymentDate"
          control={control}
          render={({ field }) => (
            <DatePickerField
              label="Payment Date"
              value={field.value ? dayjs(field.value) : null}
              onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              maxDate={dayjs()}
            />
          )}
        />

        <TextField label="Reference Number" fullWidth margin="normal" {...register('referenceNumber')} />

        <Divider sx={{ my: 2.5 }} />

        <TextField
          select
          label="Payment Status"
          fullWidth
          margin="normal"
          helperText="Automatic follows the payments. Choosing a status pins it until you switch back."
          {...register('paymentStatus')}
        >
          {PAYMENT_STATUS_CHOICES.map((choice) => (
            <MenuItem key={choice} value={choice}>
              {choice === 'AUTO' ? 'Automatic (from payments)' : resolveStatusConfig('paymentTracker', choice).label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Remarks / Notes"
          fullWidth
          margin="normal"
          multiline
          rows={3}
          error={Boolean(errors.remarks)}
          helperText={errors.remarks?.message}
          {...register('remarks')}
        />
      </FormDrawer>

      <PaymentHistoryDialog open={historyOpen} record={record} onClose={() => setHistoryOpen(false)} />
    </>
  );
}
