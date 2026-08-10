import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { resolveStatusConfig } from '../../components/statusConfig';
import { usePermission } from '../../hooks/usePermission';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type { CreatableQuotationStatus, CreateQuotationInput, QuotationDetail } from '../../types/quotation';
import { QUOTATION_CREATE_STATUSES } from '../../validation/quotationSchemas';
import { QuotationItemsEditor } from '../quotations/QuotationItemsEditor';
import {
  EMPTY_QUOTATION_DRAFT_ITEM,
  quotationDraftTotals,
  toQuotationItemsInput,
  type QuotationDraftItem,
} from '../quotations/quotationDraft';

const todayISO = () => new Date().toISOString().slice(0, 10);

interface EnquiryQuotationDialogProps {
  open: boolean;
  /** The enquiry the quotation is raised against — `null` while the dialog is closed. */
  enquiry: { id: string; enquiryNumber: string; customerName: string } | null;
  onClose: () => void;
  /** Called once the quotation exists. "md files/Enquiry/flow.md" §2.3 sends the user to the
   *  Enquiry List from here; the caller decides so the dialog stays reusable. */
  onSaved: (quotation: QuotationDetail) => void;
}

/**
 * "md files/Enquiry/flow.md" §2.3 — Create Quotation from an enquiry without navigating away from
 * the page the user is on. The quotation itself is created through the same
 * `POST /quotations` (source ENQUIRY) call the Quotation form uses, with the same item/tax entry
 * grid (QuotationItemsEditor) and the same statuses, so no second quotation implementation exists.
 */
export function EnquiryQuotationDialog({ open, enquiry, onClose, onSaved }: EnquiryQuotationDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  // Mirrors the API guard on the create route: APPROVED answers to the Approve permission rather
  // than to Create.
  const canApprove = usePermission('QUOTATIONS', 'canApprove');

  const [items, setItems] = useState<QuotationDraftItem[]>([{ ...EMPTY_QUOTATION_DRAFT_ITEM }]);
  const [cgstPercent, setCgstPercent] = useState('');
  const [sgstPercent, setSgstPercent] = useState('');
  const [quotationDate, setQuotationDate] = useState(todayISO);
  const [status, setStatus] = useState<CreatableQuotationStatus>('DRAFT');
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Each opening starts a fresh quotation — a previous draft that was cancelled should not reappear.
  useEffect(() => {
    if (!open) return;
    setItems([{ ...EMPTY_QUOTATION_DRAFT_ITEM }]);
    setCgstPercent('');
    setSgstPercent('');
    setQuotationDate(todayISO());
    setStatus('DRAFT');
    setItemsError(null);
    setServerError(null);
  }, [open]);

  const totals = quotationDraftTotals(items, cgstPercent, sgstPercent);

  const createMutation = useMutation({
    mutationFn: (input: CreateQuotationInput) => quotationService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      // Creating a quotation moves the enquiry to "Quotation to Share", and saving straight into
      // Approved confirms it and raises the order — the same lists the Quotation form refreshes.
      queryClient.invalidateQueries({ queryKey: ['enquiry'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payment-tracker'] });
    },
  });

  async function handleSave() {
    if (!enquiry) return;
    setServerError(null);
    setItemsError(null);

    const parsed = toQuotationItemsInput(items, 'Add at least one item.');
    if (parsed.items === null) {
      setItemsError(parsed.error);
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        source: 'ENQUIRY',
        enquiryId: enquiry.id,
        status,
        quotationDate: quotationDate || undefined,
        cgstPercent: totals.cgstPercent,
        sgstPercent: totals.sgstPercent,
        items: parsed.items,
      });
      showToast(`Quotation ${created.quotationNumber} created for enquiry ${enquiry.enquiryNumber}.`);
      onSaved(created);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Unable to create the quotation. Please try again.');
      }
    }
  }

  return (
    <Dialog open={open} onClose={createMutation.isPending ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RequestQuoteIcon fontSize="small" />
        Create Quotation
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {enquiry?.customerName ?? '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {enquiry ? `Enquiry ${enquiry.enquiryNumber} — the quotation is versioned against it.` : ''}
            </Typography>
          </Paper>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Quotation Date"
              type="date"
              fullWidth
              value={quotationDate}
              onChange={(event) => setQuotationDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              select
              label="Status"
              fullWidth
              value={status}
              onChange={(event) => setStatus(event.target.value as CreatableQuotationStatus)}
              helperText={
                canApprove ? 'The status this quotation is saved in.' : 'Approving a quotation needs the Approve permission.'
              }
            >
              {QUOTATION_CREATE_STATUSES.map((option) => (
                <MenuItem key={option} value={option} disabled={option === 'APPROVED' && !canApprove}>
                  {resolveStatusConfig('quotation', option).label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {status === 'APPROVED' && (
            <Alert severity="warning">
              Saving as Approved confirms the enquiry and raises the order and its payment tracker entry,
              exactly as the Confirm Quotation action does.
            </Alert>
          )}

          <QuotationItemsEditor
            items={items}
            onItemsChange={setItems}
            cgstPercent={cgstPercent}
            sgstPercent={sgstPercent}
            onCgstChange={setCgstPercent}
            onSgstChange={setSgstPercent}
            totals={totals}
            error={itemsError}
          />

          <Typography variant="caption" color="text.secondary">
            Sample decor images can be added once the quotation is saved.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={createMutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={createMutation.isPending || !enquiry}>
          {createMutation.isPending ? 'Saving…' : 'Save Quotation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
