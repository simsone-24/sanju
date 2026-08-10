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
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { resolveStatusConfig } from '../../components/statusConfig';
import * as enquiryService from '../../services/enquiryService';
import type { ApiErrorResponse } from '../../types/api';
import type { EnquiryStatus } from '../../types/enquiry';
import { orderConfirmedWarning } from './enquiryOrderConfirmGuard';
import { useEnquiryQuotations } from './useEnquiryQuotations';

// "md files/Enquiry/enq.md" §4: every status is reachable from every other one — "Users can change
// enquiry status at any time. No validation should force quotation status before changing enquiry
// status." So the full list is offered, with no transition filtering.
const ENQUIRY_STATUS_OPTIONS: EnquiryStatus[] = [
  'PENDING',
  'APPOINTMENT_FIXED',
  'QUOTATION_TO_SHARE',
  'QUOTATION_SHARED',
  'ORDER_CONFIRMED',
  'ORDER_LOST',
];

interface EnquiryStatusDialogProps {
  open: boolean;
  enquiryId: string;
  currentStatus: EnquiryStatus;
  onClose: () => void;
}

export function EnquiryStatusDialog({ open, enquiryId, currentStatus, onClose }: EnquiryStatusDialogProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<EnquiryStatus>(currentStatus);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  // "md files/Enquiry/flow.md" §3 — the pre-condition the user has been asked to confirm past.
  // Set only while the confirmation is on screen; clearing it cancels the status change.
  const [pendingWarning, setPendingWarning] = useState<string | null>(null);

  // Read from the same cache the page's Quotations table fills, so the guard reflects what is on
  // screen without a request of its own.
  const { data: quotations } = useEnquiryQuotations(enquiryId, open);

  // Reopening after a change elsewhere should start from what the enquiry actually is now.
  useEffect(() => {
    if (open) {
      setStatus(currentStatus);
      setRemarks('');
      setError(null);
      setPendingWarning(null);
    }
  }, [open, currentStatus]);

  const mutation = useMutation({
    mutationFn: () => enquiryService.changeStatus(enquiryId, status, remarks || undefined),
    onSuccess: () => {
      // Confirming raises the order and its tracker row, so those lists are refreshed too.
      queryClient.invalidateQueries({ queryKey: ['enquiry', enquiryId] });
      queryClient.invalidateQueries({ queryKey: ['enquiry-timeline', enquiryId] });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payment-tracker'] });
      setPendingWarning(null);
      onClose();
    },
    onError: (mutationError) => {
      setPendingWarning(null);
      if (isAxiosError<ApiErrorResponse>(mutationError) && mutationError.response) {
        setError(mutationError.response.data.message);
      } else {
        setError('Unable to change the enquiry status. Please try again.');
      }
    },
  });

  // Confirmation only, never a block: a missing or unapproved quotation surfaces a message the user
  // can accept and carry on with.
  function handleSubmit() {
    setError(null);
    if (status === 'ORDER_CONFIRMED') {
      const warning = orderConfirmedWarning((quotations?.records ?? []).map((quotation) => quotation.status));
      if (warning) {
        setPendingWarning(warning);
        return;
      }
    }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Change Enquiry Status</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {status === 'ORDER_CONFIRMED' && currentStatus !== 'ORDER_CONFIRMED' && (
            <Alert severity="info">
              Confirming creates the order and its payment tracker entry from this enquiry.
            </Alert>
          )}
          <TextField
            select
            label="Status"
            fullWidth
            value={status}
            onChange={(event) => setStatus(event.target.value as EnquiryStatus)}
          >
            {ENQUIRY_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {resolveStatusConfig('enquiry', option).label}
              </MenuItem>
            ))}
          </TextField>
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
          onClick={handleSubmit}
          disabled={mutation.isPending || status === currentStatus}
        >
          {mutation.isPending ? 'Saving...' : 'Change Status'}
        </Button>
      </DialogActions>

      <ConfirmDialog
        open={pendingWarning !== null}
        title="Move to Order Confirmed?"
        message={pendingWarning ?? ''}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
        onClose={() => setPendingWarning(null)}
      />
    </Dialog>
  );
}
