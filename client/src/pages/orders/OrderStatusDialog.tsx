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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { resolveStatusConfig } from '../../components/statusConfig';
import { usePermission } from '../../hooks/usePermission';
import * as orderService from '../../services/orderService';
import type { ApiErrorResponse } from '../../types/api';
import type { OrderStatus } from '../../types/order';
import { allowedOrderTransitions } from './orderStatusTransitions';

interface OrderStatusDialogProps {
  open: boolean;
  orderId: number;
  currentStatus: OrderStatus;
  onClose: () => void;
}

/**
 * Change Order Status, reached from the page's Actions menu — the Order Details equivalent of the
 * Enquiry module's status dialog, so both modules change status the same way.
 *
 * The options offered are the ones this user is permitted to set (allowedOrderTransitions mirrors
 * the per-status guards on PATCH /orders/:id/status), never a workflow-ordered subset: any status
 * may follow any other, and payment standing is tracked separately in the Payment Tracker.
 */
export function OrderStatusDialog({ open, orderId, currentStatus, onClose }: OrderStatusDialogProps) {
  const queryClient = useQueryClient();
  const canEdit = usePermission('ORDERS', 'canEdit');
  const canCancel = usePermission('ORDERS', 'canCancel');
  const canCompleteEvent = usePermission('ORDERS', 'canCompleteEvent');
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [cancellationReason, setCancellationReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  const options = allowedOrderTransitions(currentStatus, { canEdit, canCancel, canCompleteEvent });

  // Reopening after a change made elsewhere should start from what the order actually is now.
  useEffect(() => {
    if (open) {
      setStatus(currentStatus);
      setCancellationReason('');
      setRemarks('');
      setError(null);
    }
  }, [open, currentStatus]);

  const mutation = useMutation({
    mutationFn: () =>
      orderService.changeStatus(orderId, {
        status,
        cancellationReason: status === 'REJECTED' ? cancellationReason : undefined,
        remarks: remarks || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    },
    onError: (mutationError) => {
      if (isAxiosError<ApiErrorResponse>(mutationError) && mutationError.response) {
        setError(mutationError.response.data.message);
      } else {
        setError('Unable to change the order status. Please try again.');
      }
    },
  });

  // Mirrors the server rule: rejecting an order records why (orders/service.ts changeStatus).
  const reasonMissing = status === 'REJECTED' && cancellationReason.trim() === '';
  const unchanged = status === currentStatus;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Change Order Status</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {options.length === 0 && (
            <Alert severity="info">You do not have permission to change this order&apos;s status.</Alert>
          )}
          <TextField
            select
            label="Status"
            fullWidth
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus)}
            disabled={options.length === 0}
          >
            {/* The order's own status is listed so the field reads its current value, but it is not
                a submittable choice — the Change Status button stays disabled on it. */}
            <MenuItem value={currentStatus}>{resolveStatusConfig('order', currentStatus).label}</MenuItem>
            {options.map((option) => (
              <MenuItem key={option} value={option}>
                {resolveStatusConfig('order', option).label}
              </MenuItem>
            ))}
          </TextField>
          {status === 'REJECTED' && (
            <TextField
              label="Rejection Reason"
              required
              fullWidth
              multiline
              minRows={2}
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              helperText="Required when rejecting an order."
            />
          )}
          <TextField
            label="Remarks"
            fullWidth
            multiline
            minRows={2}
            placeholder="Optional — recorded on the timeline."
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || unchanged || reasonMissing}
        >
          {mutation.isPending ? 'Saving...' : 'Change Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
