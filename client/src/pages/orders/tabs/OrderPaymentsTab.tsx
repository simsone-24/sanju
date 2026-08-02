import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import { Alert, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { DatePickerField } from '../../../components/DatePickerField';
import { FormDrawer } from '../../../components/FormDrawer';
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

// Pending/Partial/Paid is derived from paidAmount vs pendingAmount, never stored — the payments
// table has no status column (docs/02_DATABASE_DESIGN.md). "Overdue" is intentionally not one of
// the states: nothing in the schema records a payment due date to compute it against.
function derivePaymentStatus(order: OrderDetail): { label: string; color: 'default' | 'warning' | 'success' } {
  if (order.status === 'CANCELLED') return { label: 'Cancelled', color: 'default' };
  if (Number(order.pendingAmount) <= 0) return { label: 'Paid', color: 'success' };
  if (Number(order.paidAmount) > 0) return { label: 'Partial', color: 'warning' };
  return { label: 'Pending', color: 'default' };
}

export default function OrderPaymentsTab({ order }: OrderPaymentsTabProps) {
  const queryClient = useQueryClient();
  const canCreate = usePermission('PAYMENTS', 'canCreate');
  const canExport = usePermission('PAYMENTS', 'canExport');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const pendingAmount = Number(order.pendingAmount);

  const {
    control,
    register,
    handleSubmit,
    reset,
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

  const status = derivePaymentStatus(order);
  const canAddPayment = canCreate && pendingAmount > 0 && order.status !== 'CLOSED' && order.status !== 'CANCELLED';

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
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="body2" color="text.secondary">
            Total Amount
          </Typography>
          <Typography variant="h2">{formatCurrency(order.totalAmount)}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="body2" color="text.secondary">
            Paid
          </Typography>
          <Typography variant="h2">{formatCurrency(order.paidAmount)}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="body2" color="text.secondary">
            Pending
          </Typography>
          <Typography variant="h2">{formatCurrency(order.pendingAmount)}</Typography>
        </Paper>
      </Stack>

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Chip
          label={status.label}
          size="small"
          color={status.color === 'default' ? undefined : status.color}
          variant={status.color === 'default' ? 'outlined' : 'filled'}
        />
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

      <FormDrawer
        open={drawerOpen}
        title="Add Payment"
        onClose={() => setDrawerOpen(false)}
        onSave={onSubmit}
        saving={createMutation.isPending}
      >
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Maximum payable amount: {formatCurrency(order.pendingAmount)}
        </Typography>
        <TextField select label="Payment Type" fullWidth margin="normal" {...register('paymentType')}>
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
          margin="normal"
          error={Boolean(errors.amount)}
          helperText={errors.amount?.message}
          {...register('amount')}
        />
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
        <TextField label="Remarks" fullWidth margin="normal" multiline rows={2} {...register('remarks')} />
      </FormDrawer>
    </>
  );
}
