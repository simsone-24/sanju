import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { DatePickerField } from '../../components/DatePickerField';
import { TimePickerField } from '../../components/TimePickerField';
import { resolveStatusConfig } from '../../components/statusConfig';
import * as enquiryService from '../../services/enquiryService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type { AppointmentStatus, EnquiryListItem } from '../../types/enquiry';

const APPOINTMENT_STATUS_OPTIONS: AppointmentStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

interface EnquiryAppointmentDialogProps {
  enquiry: EnquiryListItem | null;
  onClose: () => void;
}

// Quick-action dialog opened from the 📅 icon on the Enquiry list row (see md files/Enquiry/indexUI.md).
// Reuses the existing PUT /enquiries/:id endpoint — no new backend logic, same as editing these
// three fields from the full Enquiry form, just without leaving the list.
export function EnquiryAppointmentDialog({ enquiry, onClose }: EnquiryAppointmentDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [appointmentDate, setAppointmentDate] = useState<Dayjs | null>(null);
  const [appointmentTime, setAppointmentTime] = useState<Dayjs | null>(null);
  const [appointmentStatus, setAppointmentStatus] = useState<AppointmentStatus>('PENDING');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enquiry) return;
    setAppointmentDate(enquiry.appointmentDate ? dayjs(enquiry.appointmentDate) : null);
    setAppointmentTime(null);
    setAppointmentStatus(enquiry.appointmentStatus);
    setError(null);
  }, [enquiry]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!enquiry) throw new Error('No enquiry selected.');
      return enquiryService.update(enquiry.id, {
        appointmentDate: appointmentDate ? appointmentDate.format('YYYY-MM-DD') : undefined,
        appointmentTime: appointmentTime ? appointmentTime.format('hh:mm A') : undefined,
        appointmentStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries', 'stats'] });
      showToast('Appointment updated.');
      onClose();
    },
    onError: (err) => {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        setError(err.response.data.message);
      } else {
        setError('Unable to update the appointment.');
      }
    },
  });

  return (
    <Dialog open={enquiry !== null} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Update Appointment{enquiry ? ` — ${enquiry.enquiryNumber}` : ''}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <DatePickerField label="Appointment Date" margin="none" value={appointmentDate} onChange={setAppointmentDate} />
          <TimePickerField label="Appointment Time" margin="none" value={appointmentTime} onChange={setAppointmentTime} />
          <TextField
            select
            label="Appointment Status"
            fullWidth
            size="small"
            value={appointmentStatus}
            onChange={(event) => setAppointmentStatus(event.target.value as AppointmentStatus)}
          >
            {APPOINTMENT_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {resolveStatusConfig('appointment', option).label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
