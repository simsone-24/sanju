import { zodResolver } from '@hookform/resolvers/zod';
import BadgeIcon from '@mui/icons-material/Badge';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NotesIcon from '@mui/icons-material/Notes';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import PlaceIcon from '@mui/icons-material/Place';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { DatePickerField } from '../../../components/DatePickerField';
import { FormDrawer } from '../../../components/FormDrawer';
import { InfoCard, InfoLine } from '../../../components/InfoCard';
import { derivePaymentStatus, resolveStatusConfig } from '../../../components/statusConfig';
import { StatusBadge } from '../../../components/StatusBadge';
import { usePermission } from '../../../hooks/usePermission';
import * as orderService from '../../../services/orderService';
import * as userService from '../../../services/userService';
import type { ApiErrorResponse } from '../../../types/api';
import type { ChangeOrderStatusInput, OrderDetail, OrderStatus, UpdateOrderInput } from '../../../types/order';
import { formatCurrency } from '../../../utils/format';
import { updateOrderSchema, type UpdateOrderFormValues } from '../../../validation/orderSchemas';
import { EVENT_DATE_LOCKED_STATUSES, allowedOrderTransitions } from '../orderStatusTransitions';

interface OrderEventInfoTabProps {
  order: OrderDetail;
  /** Bumped by the page header's "Edit Order" button to open this tab's edit drawer. */
  editRequestId?: number;
}

// Payment summary rendered as colourful stat tiles ("md files/order/view.md" §Card 3).
function MoneyTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: `color-mix(in srgb, ${tone} 35%, transparent)`,
        bgcolor: `color-mix(in srgb, ${tone} 10%, transparent)`,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 700, color: tone }}>
        {value}
      </Typography>
    </Box>
  );
}

function cleanOptional(value: string | undefined): string | undefined {
  return value && value.trim() !== '' ? value : undefined;
}

function StatusChanger({ order }: { order: OrderDetail }) {
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only the moves this user is permitted to make — Cancel Order and Complete Event are separate
  // permissions in masters/user.md §Orders.
  const allowedNext = allowedOrderTransitions(order.status, {
    canEdit: usePermission('ORDERS', 'canEdit'),
    canCancel: usePermission('ORDERS', 'canCancel'),
    canCompleteEvent: usePermission('ORDERS', 'canCompleteEvent'),
  });

  const mutation = useMutation({
    mutationFn: (input: ChangeOrderStatusInput) => orderService.changeStatus(order.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', order.id] });
      setConfirmOpen(false);
      setNextStatus('');
      setCancellationReason('');
    },
  });

  async function handleConfirm() {
    setError(null);
    try {
      await mutation.mutateAsync({
        status: nextStatus as OrderStatus,
        cancellationReason: nextStatus === 'CANCELLED' ? cancellationReason : undefined,
      });
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        setError(err.response.data.message);
      } else {
        setError('Unable to change status.');
      }
    }
  }

  if (allowedNext.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        This order is in a terminal status — no further transitions are possible.
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <TextField
        select
        size="small"
        label="Change Status"
        value={nextStatus}
        onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
        sx={{ minWidth: 220 }}
      >
        {allowedNext.map((option) => (
          <MenuItem key={option} value={option}>
            {resolveStatusConfig('order', option).label}
          </MenuItem>
        ))}
      </TextField>
      <Button variant="outlined" disabled={!nextStatus} onClick={() => setConfirmOpen(true)}>
        Apply
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title={`Change status to ${nextStatus ? resolveStatusConfig('order', nextStatus).label : ''}?`}
        message={
          <Stack spacing={1.5}>
            {error && <Alert severity="error">{error}</Alert>}
            {nextStatus === 'CANCELLED' && (
              <TextField
                label="Cancellation Reason"
                required
                fullWidth
                multiline
                rows={2}
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
                helperText="Required when cancelling an order."
              />
            )}
          </Stack>
        }
        danger={nextStatus === 'CANCELLED'}
        loading={mutation.isPending}
        onConfirm={handleConfirm}
        onClose={() => setConfirmOpen(false)}
      />
    </Stack>
  );
}

export default function OrderEventInfoTab({ order, editRequestId = 0 }: OrderEventInfoTabProps) {
  const queryClient = useQueryClient();
  const canEdit = usePermission('ORDERS', 'canEdit');
  const [editOpen, setEditOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // The page-header "Edit Order" button bumps editRequestId; 0 is the initial value, so the
  // drawer never opens on first render.
  useEffect(() => {
    if (editRequestId > 0 && canEdit) setEditOpen(true);
  }, [editRequestId, canEdit]);

  const { data: users } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => userService.listActive(),
    enabled: editOpen,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOrderFormValues>({
    resolver: zodResolver(updateOrderSchema),
    defaultValues: {
      eventDate: order.eventDate,
      venue: order.venue ?? '',
      notes: order.notes ?? '',
      remarks: order.remarks ?? '',
      coordinatorId: order.coordinator?.id ?? '',
    },
  });

  useEffect(() => {
    reset({
      eventDate: order.eventDate,
      venue: order.venue ?? '',
      notes: order.notes ?? '',
      remarks: order.remarks ?? '',
      coordinatorId: order.coordinator?.id ?? '',
    });
  }, [order, reset]);

  const updateMutation = useMutation({
    mutationFn: (input: UpdateOrderInput) => orderService.update(order.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', order.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setEditOpen(false);
    },
  });

  const eventDateLocked = EVENT_DATE_LOCKED_STATUSES.includes(order.status);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await updateMutation.mutateAsync({
        eventDate: eventDateLocked ? undefined : cleanOptional(values.eventDate),
        venue: cleanOptional(values.venue),
        notes: cleanOptional(values.notes),
        remarks: cleanOptional(values.remarks),
        coordinatorId: cleanOptional(values.coordinatorId),
      });
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Unable to update order. Please try again.');
      }
    }
  });

  const total = Number(order.totalAmount);
  const paid = Number(order.paidAmount);
  const advancePercent = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <>
      {order.status === 'CANCELLED' && order.cancellationReason && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Cancelled: {order.cancellationReason}
        </Alert>
      )}

      {canEdit && (
        <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
          <Button size="small" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </Stack>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          mb: 3,
        }}
      >
        <InfoCard title="Customer Information">
          <InfoLine
            icon={<PersonIcon sx={{ fontSize: 16 }} />}
            label="Customer Name"
            value={order.customer.customerName}
          />
          <InfoLine icon={<PhoneIcon sx={{ fontSize: 16 }} />} label="Mobile" value={order.customer.mobile} />
          <InfoLine
            icon={<EmailIcon sx={{ fontSize: 16 }} />}
            label="Email"
            value={order.customer.email ?? '—'}
          />
          <InfoLine
            icon={<HomeIcon sx={{ fontSize: 16 }} />}
            label="Address"
            value={order.customer.address ?? '—'}
          />
          <InfoLine
            icon={<HistoryIcon sx={{ fontSize: 16 }} />}
            label="Customer Since"
            value={dayjs(order.customer.createdAt).format('DD MMM YYYY')}
          />
        </InfoCard>

        <InfoCard title="Event Information">
          <InfoLine
            icon={<CelebrationIcon sx={{ fontSize: 16 }} />}
            label="Event Name"
            value={order.enquiry.eventName || order.enquiry.eventType.eventName}
          />
          <InfoLine
            icon={<EventIcon sx={{ fontSize: 16 }} />}
            label="Event Date"
            value={dayjs(order.eventDate).format('DD MMM YYYY · dddd')}
          />
          <InfoLine icon={<PlaceIcon sx={{ fontSize: 16 }} />} label="Venue" value={order.venue ?? '—'} />
          <InfoLine
            icon={<BadgeIcon sx={{ fontSize: 16 }} />}
            label="Event Manager"
            value={order.coordinator?.fullName ?? 'Unassigned'}
          />
          <InfoLine
            icon={<ListAltIcon sx={{ fontSize: 16 }} />}
            label="Enquiry"
            value={order.enquiry.enquiryNumber}
          />
        </InfoCard>

        <InfoCard title="Payment Summary">
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: '1fr 1fr' }}>
            <MoneyTile label="Quotation Amount" value={formatCurrency(order.totalAmount)} tone="#2563EB" />
            <MoneyTile label="Paid" value={formatCurrency(order.paidAmount)} tone="#22C55E" />
            <MoneyTile label="Balance" value={formatCurrency(order.pendingAmount)} tone="#F59E0B" />
            <MoneyTile label="Advance %" value={`${advancePercent}%`} tone="#06B6D4" />
          </Box>
          <Box>
            <StatusBadge
              type="payment"
              status={derivePaymentStatus(order.totalAmount, order.paidAmount, order.eventDate)}
            />
          </Box>
        </InfoCard>
      </Box>

      {(order.notes || order.remarks) && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', mb: 3 }}>
          <Stack spacing={2}>
            {order.notes && (
              <InfoLine icon={<NotesIcon sx={{ fontSize: 16 }} />} label="Requirements" value={order.notes} />
            )}
            {order.remarks && (
              <InfoLine icon={<NotesIcon sx={{ fontSize: 16 }} />} label="Remarks" value={order.remarks} />
            )}
          </Stack>
        </Paper>
      )}

      {canEdit && (
        <>
          <Typography variant="h4" sx={{ mb: 1.5 }}>
            Update Event Status
          </Typography>
          <StatusChanger order={order} />
        </>
      )}

      <FormDrawer
        open={editOpen}
        title="Edit Order"
        onClose={() => setEditOpen(false)}
        onSave={onSubmit}
        saving={updateMutation.isPending || isSubmitting}
      >
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Controller
          name="eventDate"
          control={control}
          render={({ field }) => (
            <DatePickerField
              label="Event Date"
              margin="dense"
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
        <TextField label="Venue" fullWidth margin="dense" {...register('venue')} />
        <TextField label="Requirements" fullWidth margin="dense" multiline rows={2} {...register('notes')} />
        <TextField label="Remarks" fullWidth margin="dense" multiline rows={2} {...register('remarks')} />
        <TextField select label="Coordinator" fullWidth margin="dense" {...register('coordinatorId')}>
          <MenuItem value="">Unassigned</MenuItem>
          {users?.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.fullName}
            </MenuItem>
          ))}
        </TextField>
      </FormDrawer>
    </>
  );
}
