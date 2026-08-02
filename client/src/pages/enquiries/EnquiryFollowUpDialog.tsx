import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { DatePickerField } from '../../components/DatePickerField';
import * as enquiryService from '../../services/enquiryService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';

interface EnquiryFollowUpDialogProps {
  /** Open while non-null — the enquiry the follow-up is logged against. */
  enquiryId: string | null;
  onClose: () => void;
}

// CLAUDE.md §Business Workflow places an optional Follow-up step between the appointment and the
// quotation. The POST /enquiries/:id/follow-ups endpoint already existed; this is the UI that
// records one, so the Follow-ups tab isn't a read-only view of data nothing can create.
export function EnquiryFollowUpDialog({ enquiryId, onClose }: EnquiryFollowUpDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [followUpDate, setFollowUpDate] = useState<Dayjs | null>(dayjs());
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enquiryId) return;
    setFollowUpDate(dayjs());
    setOutcome('');
    setNotes('');
    setError(null);
  }, [enquiryId]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!enquiryId) throw new Error('No enquiry selected.');
      if (!followUpDate) throw new Error('A follow-up date is required.');
      return enquiryService.addFollowUp(enquiryId, {
        followUpDate: followUpDate.format('YYYY-MM-DD'),
        outcome: outcome.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiry', enquiryId] });
      showToast('Follow-up recorded.');
      onClose();
    },
    onError: (err) => {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        setError(err.response.data.message);
      } else {
        setError('Unable to record the follow-up.');
      }
    },
  });

  return (
    <Dialog open={enquiryId !== null} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Record Follow-up</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <DatePickerField
            label="Follow-up Date"
            margin="none"
            value={followUpDate}
            onChange={setFollowUpDate}
            error={!followUpDate}
            helperText={followUpDate ? undefined : 'Required'}
          />
          <TextField
            label="Outcome"
            fullWidth
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            placeholder="e.g. Customer will confirm after the weekend"
            helperText="Optional — a short summary of where things stand."
          />
          <TextField
            label="Notes"
            fullWidth
            multiline
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What was discussed?"
            helperText="Optional"
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
          disabled={mutation.isPending || !followUpDate}
        >
          {mutation.isPending ? 'Saving…' : 'Save Follow-up'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
