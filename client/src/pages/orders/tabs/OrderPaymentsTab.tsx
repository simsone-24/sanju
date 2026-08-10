import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import { Alert, Box, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { DatePickerField } from '../../../components/DatePickerField';
import { FormDialog } from '../../../components/FormDialog';
import { resolveOrderPaymentBadge } from '../../../components/statusConfig';
import { StatusBadge } from '../../../components/StatusBadge';
import { ViewField, ViewFieldGroup } from '../../../components/ViewField';
import { usePermission } from '../../../hooks/usePermission';
import * as paymentService from '../../../services/paymentService';
import type { ApiErrorResponse } from '../../../types/api';
import type { OrderDetail, OrderPaymentSummary } from '../../../types/order';
import { formatCurrency, formatDate } from '../../../utils/format';
import { createPaymentSchema, type CreatePaymentFormValues } from '../../../validation/paymentSchemas';

const PAYMENT_TYPES = ['ADVANCE', 'PARTIAL', 'FINAL'] as const;
const PAYMENT_METHODS = ['CASH', 'UPI', 'BANK', 'CARD', 'CHEQUE'] as const;

interface OrderPaymentsTabProps {
  order: OrderDetail;
}

export default function OrderPaymentsTab({ order }: OrderPaymentsTabProps) {
  const queryClient = useQueryClient();
  const canCreate = usePermission('PAYMENTS', 'canCreate');
  const canExport = usePermission('PAYMENTS', 'canExport');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const pendingAmount = Number(order.pendingAmount);
  const collectedSoFar = Number(order.paidAmount);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreatePaymentFormValues>({
    resolver: zodResolver(createPaymentSchema(pendingAmount)),
    defaultValues: {
      paymentType: Number(order.paidAmount) === 0 ? 'ADVANCE' : 'PARTIAL',
      amount: '',
      paymentMethod: 'CASH',
      paymentDate: '',
      referenceNumber: '',
      remarks: '',
    },
  });

  // §Auto Calculation "Balance = Budget - Collected", shown live against what is currently typed —
  // matches PaymentTrackerEditDialog's projectedCollected/projectedPending.
  const watchedAmount = Number(watch('amount') || 0);
  const projectedCollected = collectedSoFar + (Number.isFinite(watchedAmount) ? watchedAmount : 0);
  const projectedPending = pendingAmount - (Number.isFinite(watchedAmount) ? watchedAmount : 0);

  const createMutation = useMutation({
    mutationFn: (values: CreatePaymentFormValues) =>
      paymentService.create(order.id, {
        paymentType: values.paymentType,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
        paymentDate: values.paymentDate || undefined,
        referenceNumber: values.referenceNumber || undefined,
        remarks: values.remarks || undefined,
      }),
    onSuccess: () => {
      // Adding a payment changes order.paidAmount/pendingAmount (never its status — that stays the
      // event/work lifecycle, owned by this module) — refetching the order refreshes this tab's
      // list AND the Event Info tab together, so a single invalidation is correct here.
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', order.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDrawerOpen(false);
      reset();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await createMutation.mutateAsync(values);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Unable to record payment. Please try again.');
      }
    }
  });

  // The same badge the Event Information tab, the Orders list and the Payment Tracker show, rather
  // than a second local derivation of Pending/Partial/Paid that could disagree with them.
  const paymentBadge = resolveOrderPaymentBadge(order);
  // Payment recording no longer gates on the order's lifecycle status (see payments/service.ts) —
  // only whether there's anything left to collect.
  const canAddPayment = canCreate && pendingAmount > 0;

  const columns: DataTableColumn<OrderPaymentSummary>[] = [
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
  ];

  return (
    <>
      {/* No Total/Paid/Pending strip here: the order summary card above the tabs already carries
          those three figures and stays on screen while this tab is open. */}
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <StatusBadge {...paymentBadge} />
        {canAddPayment && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDrawerOpen(true)}>
            Add Payment
          </Button>
        )}
      </Stack>

      <DataTable
        columns={columns}
        rows={order.payments}
        getRowId={(row) => row.id}
        page={1}
        limit={100}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        emptyMessage="No payments recorded yet."
        exportFileName={`${order.orderNumber}-payments`}
        canExport={canExport}
      />

      <FormDialog
        open={drawerOpen}
        title="Add Payment"
        subtitle={order.orderNumber}
        onClose={() => setDrawerOpen(false)}
        onSave={onSubmit}
        saving={createMutation.isPending}
        maxWidth={480}
      >
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Stack spacing={2.5}>
          {/* View only — Budget, Collected, Pending — matching Payment Tracker's Edit Payment
              dialog (PaymentTrackerEditDialog), so the two read the same way. */}
          <ViewFieldGroup>
            <ViewField label="Budget Amount" value={formatCurrency(order.totalAmount)} />
            <ViewField label="Collected" value={formatCurrency(collectedSoFar)} />
            <ViewField
              label="Pending"
              value={formatCurrency(order.pendingAmount)}
              tone={pendingAmount > 0 ? 'warning' : undefined}
            />
          </ViewFieldGroup>

          <TextField select label="Payment Type" fullWidth {...register('paymentType')}>
            {PAYMENT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Amount"
            type="number"
            fullWidth
            error={Boolean(errors.amount)}
            helperText={
              errors.amount?.message ??
              (watchedAmount > 0
                ? `Collected becomes ${formatCurrency(projectedCollected)} · Pending becomes ${formatCurrency(projectedPending)}`
                : `Maximum payable amount: ${formatCurrency(order.pendingAmount)}`)
            }
            {...register('amount')}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField select label="Payment Method" fullWidth {...register('paymentMethod')}>
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
                  margin="none"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                  maxDate={dayjs()}
                />
              )}
            />
          </Box>

          <TextField label="Reference Number" fullWidth {...register('referenceNumber')} />
          <TextField label="Remarks" fullWidth multiline rows={2} {...register('remarks')} />
        </Stack>
      </FormDialog>
    </>
  );
}
