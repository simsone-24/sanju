import { zodResolver } from '@hookform/resolvers/zod';
import BadgeIcon from '@mui/icons-material/Badge';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NotesIcon from '@mui/icons-material/Notes';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { Alert, Box, Button, Divider, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CardSection, DetailRow } from '../../../components/DetailRow';
import { DatePickerField } from '../../../components/DatePickerField';
import { FormDialog } from '../../../components/FormDialog';
import { ProgressDonut } from '../../../components/ProgressDonut';
import { resolveOrderPaymentBadge, resolveStatusConfig } from '../../../components/statusConfig';
import { StatusBadge } from '../../../components/StatusBadge';
import { ViewField, ViewFieldGroup } from '../../../components/ViewField';
import { usePermission } from '../../../hooks/usePermission';
import * as orderService from '../../../services/orderService';
import type { ApiErrorResponse } from '../../../types/api';
import type { ChangeOrderStatusInput, OrderDetail, OrderStatus, UpdateOrderInput } from '../../../types/order';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format';
import { updateOrderSchema, type UpdateOrderFormValues } from '../../../validation/orderSchemas';
import { allowedOrderTransitions, EVENT_DATE_LOCKED_STATUSES } from '../orderStatusTransitions';

interface OrderOverviewTabProps {
  order: OrderDetail;
  /** Bumped by the header's "Edit Order" button to open this tab's edit drawer. */
  editRequestId?: number;
  /** Who raised the order, read from its activity trail — the Order table has no created-by column. */
  createdBy: string | null;
  /** Sends the reader to the Payments tab rather than repeating the receipts list here. */
  onViewPayments: () => void;
}

function MoneyLine({ label, value, tone }: { label: string; value: string; tone?: 'paid' | 'balance' }) {
  const color = tone === 'paid' ? 'success.dark' : tone === 'balance' ? 'error.dark' : 'text.primary';
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

function cleanOptional(value: string | undefined): string | undefined {
  return value && value.trim() !== '' ? value : undefined;
}

/**
 * Overview — everything a reader needs about the order without leaving the tab: the customer and
 * the event on the left, where the money stands and how the record was raised on the right.
 *
 * Editing stays here (the header's Edit Order button drives this drawer) but changing status does
 * not: that lives in the page's Actions menu, alongside the other whole-order actions.
 */
export default function OrderOverviewTab({ order, editRequestId = 0, createdBy, onViewPayments }: OrderOverviewTabProps) {
  const queryClient = useQueryClient();
  const canEdit = usePermission('ORDERS', 'canEdit');
  const canCancel = usePermission('ORDERS', 'canCancel');
  const canCompleteEvent = usePermission('ORDERS', 'canCompleteEvent');
  const [editOpen, setEditOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  // Status is not part of the edit form: it goes to its own endpoint with its own permissions, so
  // it is held here rather than in the react-hook-form values that PUT /orders/:id sends.
  const [nextStatus, setNextStatus] = useState<OrderStatus>(order.status);
  const [cancellationReason, setCancellationReason] = useState('');

  // The header's "Edit Order" button bumps editRequestId; 0 is the initial value, so the dialog
  // never opens on first render.
  useEffect(() => {
    if (editRequestId > 0 && canEdit) setEditOpen(true);
  }, [editRequestId, canEdit]);

  // Opening always starts from what the order is now — including after a change made from the
  // page's Actions menu while this dialog was closed.
  useEffect(() => {
    if (editOpen) {
      setNextStatus(order.status);
      setCancellationReason('');
      setServerError(null);
    }
  }, [editOpen, order.status]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateOrderFormValues>({
    resolver: zodResolver(updateOrderSchema),
    defaultValues: {
      eventDate: order.eventDate ?? '',
      venue: order.venue ?? '',
    },
  });

  useEffect(() => {
    reset({
      eventDate: order.eventDate ?? '',
      venue: order.venue ?? '',
    });
  }, [order, reset]);

  function refreshOrder() {
    queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    queryClient.invalidateQueries({ queryKey: ['order-timeline', order.id] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  }

  const updateMutation = useMutation({
    mutationFn: (input: UpdateOrderInput) => orderService.update(order.id, input),
    onSuccess: refreshOrder,
  });

  const statusMutation = useMutation({
    mutationFn: (input: ChangeOrderStatusInput) => orderService.changeStatus(order.id, input),
    onSuccess: refreshOrder,
  });

  const eventDateLocked = EVENT_DATE_LOCKED_STATUSES.includes(order.status);
  // Only the moves this user is permitted to make — allowedOrderTransitions mirrors the per-status
  // guards on PATCH /orders/:id/status. Empty means the status field is read-only for them.
  const statusOptions = allowedOrderTransitions(order.status, { canEdit, canCancel, canCompleteEvent });
  const statusChanged = nextStatus !== order.status;
  // Mirrors the server rule: rejecting an order records why (orders/service.ts changeStatus).
  const reasonMissing = statusChanged && nextStatus === 'REJECTED' && cancellationReason.trim() === '';

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    if (reasonMissing) {
      setServerError('A rejection reason is required when rejecting an order.');
      return;
    }
    try {
      // Fields first, status second: closing or rejecting an order locks its event date server-side
      // (EVENT_DATE_LOCKED_STATUSES), so a date edited in the same save has to land while the
      // order is still at a status that allows it.
      //
      // Skipped when nothing was typed — the update endpoint writes an "Order updated" entry to the
      // timeline every time it runs, and a status-only save should not leave one behind.
      if (isDirty) {
        await updateMutation.mutateAsync({
          eventDate: eventDateLocked ? undefined : cleanOptional(values.eventDate),
          venue: cleanOptional(values.venue),
        });
      }
      if (statusChanged) {
        await statusMutation.mutateAsync({
          status: nextStatus,
          cancellationReason: nextStatus === 'REJECTED' ? cancellationReason : undefined,
        });
      }
      setEditOpen(false);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Unable to update order. Please try again.');
      }
    }
  });

  const total = Number(order.totalAmount);
  const collectedPercent = total > 0 ? Math.round((Number(order.paidAmount) / total) * 100) : 0;
  // The ADVANCE-type receipts, summed exactly as the Payment Tracker does server-side
  // (payment-tracker/service.ts sumAdvance) — including the one carried over from the enquiry when
  // the order was raised, so both modules report the same advance.
  const advance = order.payments
    .filter((payment) => payment.paymentType === 'ADVANCE')
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <>
      {order.status === 'REJECTED' && order.cancellationReason && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Rejected: {order.cancellationReason}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          alignItems: 'start',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.7fr) minmax(320px, 1fr)' },
        }}
      >
        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 3 } }}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', rowGap: 1 }}
            >
              <Typography variant="h4" component="h2">
                Customer &amp; Event Details
              </Typography>
              {canEdit && (
                <Button size="small" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
              )}
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gap: { xs: 3, md: 4 },
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              }}
            >
              <CardSection icon={<PersonOutlinedIcon fontSize="small" />} title="Customer Information" tone="primary">
                <DetailRow icon={<PhoneIcon sx={{ fontSize: 16 }} />} label="Mobile" value={order.customer.mobile} />
                <DetailRow
                  icon={<EmailIcon sx={{ fontSize: 16 }} />}
                  label="Email"
                  value={order.customer.email ?? '—'}
                />
                <DetailRow
                  icon={<HomeIcon sx={{ fontSize: 16 }} />}
                  label="Address"
                  value={order.customer.address ?? '—'}
                />
                <DetailRow
                  icon={<HistoryIcon sx={{ fontSize: 16 }} />}
                  label="Customer Since"
                  value={formatDate(order.customer.createdAt)}
                />
              </CardSection>

              <CardSection icon={<EventNoteIcon fontSize="small" />} title="Event Information" tone="success">
                <DetailRow
                  icon={<BadgeIcon sx={{ fontSize: 16 }} />}
                  label="Event Manager"
                  value={order.coordinator?.fullName ?? 'Unassigned'}
                />
                <DetailRow
                  icon={<CelebrationIcon sx={{ fontSize: 16 }} />}
                  label="Event Type"
                  value={order.enquiry.eventName || order.enquiry.eventType.eventName}
                />
                <DetailRow
                  icon={<EventIcon sx={{ fontSize: 16 }} />}
                  label="Event Date"
                  // dayjs(null) formats as "Invalid Date" — an order confirmed before its date was
                  // known has to say so instead.
                  value={order.eventDate ? dayjs(order.eventDate).format('DD MMM YYYY · dddd') : 'Not scheduled'}
                />
                <DetailRow icon={<PlaceIcon sx={{ fontSize: 16 }} />} label="Venue" value={order.venue ?? '—'} />
                <DetailRow
                  icon={<ListAltIcon sx={{ fontSize: 16 }} />}
                  label="Enquiry"
                  value={order.enquiry.enquiryNumber}
                />
              </CardSection>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 3 } }}>
            <Typography variant="h4" component="h2" sx={{ mb: 2.5 }}>
              Additional Information
            </Typography>
            <Stack spacing={1.75}>
              <DetailRow
                icon={<NotesIcon sx={{ fontSize: 16 }} />}
                label="Requirements"
                value={
                  <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'pre-line' }}>
                    {order.notes || '—'}
                  </Typography>
                }
              />
              <DetailRow
                icon={<NotesIcon sx={{ fontSize: 16 }} />}
                label="Remarks"
                value={
                  <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'pre-line' }}>
                    {order.remarks || '—'}
                  </Typography>
                }
              />
            </Stack>
          </Paper>
        </Stack>

        <Paper variant="outlined" sx={{ borderRadius: '16px', p: { xs: 2, sm: 3 }, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', rowGap: 1 }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
              <ReceiptLongIcon fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography variant="h4" component="h2">
                Payment Summary
              </Typography>
            </Stack>
            <Button size="small" variant="outlined" onClick={onViewPayments}>
              View Payments
            </Button>
          </Stack>

          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}>
            <ProgressDonut percent={collectedPercent} caption="Paid" size={124} />
            <Stack spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
              <MoneyLine label="Total Amount" value={formatCurrency(order.totalAmount)} />
              <MoneyLine label="Paid Amount" value={formatCurrency(order.paidAmount)} tone="paid" />
              <MoneyLine label="Balance Amount" value={formatCurrency(order.pendingAmount)} tone="balance" />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 2.5, flexWrap: 'wrap', rowGap: 1 }}>
            {/* The same badge the Orders list and the Payment Tracker show — see
                resolveOrderPaymentBadge — so all three report one payment standing. */}
            <StatusBadge {...resolveOrderPaymentBadge(order)} />
            <Typography variant="caption" color="text.secondary">
              Advance collected: {formatCurrency(advance)}
            </Typography>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h4" component="h2" sx={{ mb: 2.5 }}>
            Order Information
          </Typography>
          <Stack spacing={1.75}>
            <DetailRow icon={<ListAltIcon sx={{ fontSize: 16 }} />} label="Order ID" value={order.orderNumber} />
            <DetailRow
              icon={<EventNoteIcon sx={{ fontSize: 16 }} />}
              label="Order Status"
              value={<StatusBadge type="order" status={order.status} />}
            />
            <DetailRow
              icon={<PersonOutlinedIcon sx={{ fontSize: 16 }} />}
              label="Created By"
              value={createdBy ?? '—'}
            />
            <DetailRow
              icon={<HistoryIcon sx={{ fontSize: 16 }} />}
              label="Created On"
              value={formatDateTime(order.createdAt)}
            />
            <DetailRow
              icon={<HistoryIcon sx={{ fontSize: 16 }} />}
              label="Last Updated"
              value={formatDateTime(order.updatedAt)}
            />
          </Stack>
        </Paper>
      </Box>

      {/* A centred popup rather than a side panel: the form is short, and editing an order is a
          focused act that reads better with the record stated at the top of it than with the page
          it belongs to still half-visible behind a drawer. */}
      <FormDialog
        open={editOpen}
        title="Edit Order"
        subtitle={order.orderNumber}
        onClose={() => setEditOpen(false)}
        onSave={onSubmit}
        saving={updateMutation.isPending || statusMutation.isPending || isSubmitting}
        maxWidth={600}
      >
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Stack spacing={2.5}>
          {/* Read-only: what is being edited. None of these belong to the order itself — they are
              the customer and the event it was raised for, changed on those records, not here. */}
          <ViewFieldGroup>
            <ViewField label="Customer" value={order.customer.customerName} />
            <ViewField label="Event Type" value={order.enquiry.eventName || order.enquiry.eventType.eventName} />
            <ViewField label="Enquiry" value={order.enquiry.enquiryNumber} />
          </ViewFieldGroup>

          <Controller
            name="eventDate"
            control={control}
            render={({ field }) => (
              <DatePickerField
                label="Event Date"
                margin="none"
                value={field.value ? dayjs(field.value) : null}
                onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                error={Boolean(errors.eventDate)}
                helperText={
                  eventDateLocked
                    ? `Cannot change the event date while status is ${order.status.replaceAll('_', ' ')}.`
                    : errors.eventDate?.message
                }
              />
            )}
          />

          <TextField label="Venue" fullWidth {...register('venue')} />

          <Divider />

          {/* Saved through PATCH /orders/:id/status, not the order update above — a separate
              endpoint with its own permissions, applied only when the value actually changes. */}
          <TextField
            select
            label="Order Status"
            fullWidth
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
            disabled={statusOptions.length === 0}
            helperText={
              statusOptions.length === 0
                ? 'You do not have permission to change this order’s status.'
                : 'Recorded on the timeline when saved.'
            }
          >
            {/* The current status is listed so the field reads its value; the others are the ones
                this user may move to. */}
            <MenuItem value={order.status}>{resolveStatusConfig('order', order.status).label}</MenuItem>
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {resolveStatusConfig('order', option).label}
              </MenuItem>
            ))}
          </TextField>

          {statusChanged && nextStatus === 'REJECTED' && (
            <TextField
              label="Rejection Reason"
              required
              fullWidth
              multiline
              rows={2}
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              error={reasonMissing && Boolean(serverError)}
              helperText="Required when rejecting an order."
            />
          )}
        </Stack>
      </FormDialog>
    </>
  );
}
