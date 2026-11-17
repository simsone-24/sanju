import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormDialog } from '../../components/FormDialog';
import { ViewField } from '../../components/ViewField';
import * as paymentTrackerService from '../../services/paymentTrackerService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import { formatCurrency } from '../../utils/format';
import { adjustBudgetSchema, type AdjustBudgetFormValues } from '../../validation/paymentTrackerSchemas';

interface AdjustBudgetDialogProps {
  open: boolean;
  orderId: number;
  orderNumber: string;
  currentBudget: number;
  collectedSoFar: number;
  onClose: () => void;
}

/**
 * Changes an order's budget when the real amount moves — typically items added (or dropped) on the
 * event day. Shared by the Order Payments tab and the Payment Tracker so both go through the same
 * server rule: a reason is required, and the budget cannot fall below what is already collected.
 */
export function AdjustBudgetDialog({
  open,
  orderId,
  orderNumber,
  currentBudget,
  collectedSoFar,
  onClose,
}: AdjustBudgetDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdjustBudgetFormValues>({
    resolver: zodResolver(adjustBudgetSchema(collectedSoFar, currentBudget)),
    defaultValues: { budgetAmount: String(currentBudget), reason: '' },
  });

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    reset({ budgetAmount: String(currentBudget), reason: '' });
  }, [open, currentBudget, reset]);

  const newBudget = Number(watch('budgetAmount'));
  const hasNewBudget = Number.isFinite(newBudget) && newBudget > 0;
  const difference = newBudget - currentBudget;

  const mutation = useMutation({
    mutationFn: (values: AdjustBudgetFormValues) =>
      paymentTrackerService.update(orderId, {
        budgetAmount: Number(values.budgetAmount),
        budgetChangeReason: values.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-tracker'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', orderId] });
      showToast(`Budget updated for order "${orderNumber}".`, 'success');
      onClose();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) setServerError(error.response.data.message);
      else setServerError('Unable to update the budget. Please try again.');
    }
  });

  return (
    <FormDialog
      open={open}
      title="Adjust Budget"
      subtitle={orderNumber}
      onClose={onClose}
      onSave={onSubmit}
      saving={mutation.isPending}
      maxWidth={460}
    >
      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}
      <Stack spacing={2.5}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <ViewField label="Current Budget" value={formatCurrency(currentBudget)} />
          <ViewField label="Collected" value={formatCurrency(collectedSoFar)} />
        </Box>

        <TextField
          label="New Budget Amount"
          type="number"
          fullWidth
          error={Boolean(errors.budgetAmount)}
          helperText={errors.budgetAmount?.message}
          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          {...register('budgetAmount')}
        />
        {hasNewBudget && difference !== 0 && (
          <Typography variant="body2" color="text.secondary">
            {difference > 0 ? 'Increase' : 'Decrease'} of {formatCurrency(Math.abs(difference))} · Pending becomes{' '}
            {formatCurrency(newBudget - collectedSoFar)}
          </Typography>
        )}

        <TextField
          label="Reason for Change"
          fullWidth
          multiline
          rows={3}
          placeholder="e.g. 20 extra chairs and a stage banner added on the event day"
          error={Boolean(errors.reason)}
          helperText={errors.reason?.message}
          {...register('reason')}
        />
      </Stack>
    </FormDialog>
  );
}
