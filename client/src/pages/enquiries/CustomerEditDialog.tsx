import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import * as customerService from '../../services/customerService';
import type { ApiErrorResponse } from '../../types/api';
import type { CustomerDetail } from '../../types/customer';

interface CustomerEditDialogProps {
  open: boolean;
  customer: CustomerDetail;
  onClose: () => void;
  /** Called with the saved record so the caller can refresh what it shows without a refetch round-trip. */
  onSaved?: (customer: CustomerDetail) => void;
}

const mobileRegex = /^[6-9]\d{9}$/;

interface FormState {
  customerName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
}

function toFormState(customer: CustomerDetail): FormState {
  return {
    customerName: customer.customerName,
    mobile: customer.mobile,
    whatsapp: customer.whatsapp ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    city: customer.city ?? '',
  };
}

// Edits the customer master record itself — reachable from the Enquiry form's Existing Customer
// step, not just the customer profile. There is only ever one copy of a customer's contact
// details (never duplicated onto the enquiry), so this is the one place a linked customer's own
// record can be corrected without leaving the enquiry.
export function CustomerEditDialog({ open, customer, onClose, onSaved }: CustomerEditDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => toFormState(customer));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(toFormState(customer));
      setFieldErrors({});
      setError(null);
    }
  }, [open, customer]);

  const mutation = useMutation({
    mutationFn: () =>
      customerService.update(customer.id, {
        customerName: form.customerName.trim(),
        mobile: form.mobile.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSaved?.(updated);
      onClose();
    },
    onError: (mutationError) => {
      if (isAxiosError<ApiErrorResponse>(mutationError) && mutationError.response) {
        setError(mutationError.response.data.message);
      } else {
        setError('Unable to update the customer. Please try again.');
      }
    },
  });

  function handleSubmit() {
    setError(null);
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.customerName.trim()) nextErrors.customerName = 'Customer name is required.';
    if (!mobileRegex.test(form.mobile.trim())) nextErrors.mobile = 'Enter a valid 10-digit mobile number.';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    mutation.mutate();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Customer</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Customer Name"
            required
            fullWidth
            autoFocus
            value={form.customerName}
            onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
            error={Boolean(fieldErrors.customerName)}
            helperText={fieldErrors.customerName}
          />
          <TextField
            label="Phone Number"
            required
            fullWidth
            value={form.mobile}
            onChange={(event) => setForm((prev) => ({ ...prev, mobile: event.target.value }))}
            error={Boolean(fieldErrors.mobile)}
            helperText={fieldErrors.mobile}
          />
          <TextField
            label="WhatsApp"
            fullWidth
            placeholder="If different from mobile"
            value={form.whatsapp}
            onChange={(event) => setForm((prev) => ({ ...prev, whatsapp: event.target.value }))}
          />
          <TextField
            label="Email"
            fullWidth
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email}
          />
          <TextField
            label="City"
            fullWidth
            value={form.city}
            onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
          />
          <TextField
            label="Address"
            fullWidth
            multiline
            rows={2}
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
