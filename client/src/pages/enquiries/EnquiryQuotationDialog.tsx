import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { resolveStatusConfig } from '../../components/statusConfig';
import { usePermission } from '../../hooks/usePermission';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type {
  CreateQuotationInput,
  QuotationDetail,
  QuotationRecipient,
  QuotationStatus,
  UpdateQuotationInput,
} from '../../types/quotation';
import { formatDate } from '../../utils/format';
import { QUOTATION_CREATE_STATUSES, QUOTATION_EDIT_STATUSES } from '../../validation/quotationSchemas';
import QuotationPreview from '../quotations/QuotationPreview';
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
  enquiry: {
    id: number;
    enquiryNumber: string;
    customerName: string;
    mobile: string;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
  } | null;
  /**
   * The quotation to edit. `null`/omitted composes a new one — the same dialog either way, so
   * editing a quotation raised from an enquiry never sends the user off to the Quotation form.
   */
  quotationId?: number | null;
  onClose: () => void;
  /** Called once the quotation is saved. The caller decides where to go, so the dialog stays reusable. */
  onSaved: (quotation: QuotationDetail) => void;
}

/**
 * "md files/Enquiry/flow.md" §2.3 — Create *or* edit a quotation from an enquiry without navigating
 * away from the page the user is on. Both go through the same calls the Quotation form uses
 * (`POST /quotations` with source ENQUIRY, `PUT /quotations/:id`), with the same item/tax entry grid
 * (QuotationItemsEditor) and the same statuses, so no second quotation implementation exists.
 */
export function EnquiryQuotationDialog({ open, enquiry, quotationId, onClose, onSaved }: EnquiryQuotationDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  // Mirrors the API guard on the create route: APPROVED answers to the Approve permission rather
  // than to Create.
  const canApprove = usePermission('QUOTATIONS', 'canApprove');

  const [items, setItems] = useState<QuotationDraftItem[]>([{ ...EMPTY_QUOTATION_DRAFT_ITEM }]);
  const [cgstPercent, setCgstPercent] = useState('');
  const [sgstPercent, setSgstPercent] = useState('');
  const [quotationDate, setQuotationDate] = useState(todayISO);
  const [status, setStatus] = useState<QuotationStatus>('DRAFT');
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // Shown by default — mirrors the Quotation form's live preview so this dialog produces the same
  // WYSIWYG check before saving.
  const [previewOpen, setPreviewOpen] = useState(true);

  const isEdit = Boolean(quotationId);

  // The quotation being edited. Shares the ['quotation', id] key with the Quotation view/form pages,
  // so an already-read quotation opens from cache.
  const { data: existingQuotation, isLoading: isLoadingQuotation } = useQuery({
    queryKey: ['quotation', quotationId],
    queryFn: () => quotationService.getById(quotationId!),
    enabled: open && Boolean(quotationId),
  });

  // Which quotation the fields below currently hold, so a refetch of ['quotation', id] while the
  // dialog is open cannot overwrite half-finished edits. Cleared when the dialog closes.
  const prefilledFor = useRef<number | null>(null);

  // Each opening starts from scratch: an empty draft when creating, the stored quotation when
  // editing — a previous draft that was cancelled should never reappear.
  useEffect(() => {
    if (!open) {
      prefilledFor.current = null;
      return;
    }
    if (!quotationId) {
      if (prefilledFor.current === 0) return;
      prefilledFor.current = 0;
      setItems([{ ...EMPTY_QUOTATION_DRAFT_ITEM }]);
      setCgstPercent('');
      setSgstPercent('');
      setQuotationDate(todayISO());
      setStatus('DRAFT');
      setItemsError(null);
      setServerError(null);
      setPreviewOpen(true);
      return;
    }
    if (!existingQuotation || prefilledFor.current === existingQuotation.id) return;
    prefilledFor.current = existingQuotation.id;
    // A trailing empty row is appended because that is how QuotationItemsEditor offers the next one.
    setItems([
      ...existingQuotation.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        rate: item.rate,
      })),
      { ...EMPTY_QUOTATION_DRAFT_ITEM },
    ]);
    setCgstPercent(Number(existingQuotation.cgstPercent) ? existingQuotation.cgstPercent : '');
    setSgstPercent(Number(existingQuotation.sgstPercent) ? existingQuotation.sgstPercent : '');
    setQuotationDate(existingQuotation.quotationDate.slice(0, 10));
    setStatus(existingQuotation.status);
    setItemsError(null);
    setServerError(null);
    setPreviewOpen(true);
  }, [open, quotationId, existingQuotation]);

  // REVISED is only offered on a quotation that already carries it — it is a state the server sets
  // when a revision supersedes one, not an ordinary pick.
  const statusOptions = (isEdit ? QUOTATION_EDIT_STATUSES : QUOTATION_CREATE_STATUSES).filter(
    (option) => option !== 'REVISED' || existingQuotation?.status === 'REVISED',
  );

  const totals = quotationDraftTotals(items, cgstPercent, sgstPercent);

  // Company letterhead + bank details for the live preview (mirrors the printed PDF).
  const { data: branding } = useQuery({
    queryKey: ['quotation-branding'],
    queryFn: () => quotationService.getBranding(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const previewRecipient: QuotationRecipient = enquiry
    ? {
        name: enquiry.customerName,
        phone: enquiry.mobile,
        whatsapp: enquiry.whatsapp ?? enquiry.mobile,
        email: enquiry.email,
        address: enquiry.address,
        gst: null,
      }
    : { name: null, phone: null, whatsapp: null, email: null, address: null, gst: null };

  // Both paths touch the same records, so they share one refresh: saving into Approved confirms the
  // enquiry and raises the order, and editing an approved quotation moves that order's total and the
  // enquiry's final budget (quotations/service.ts create/update).
  function invalidateAfterSave() {
    queryClient.invalidateQueries({ queryKey: ['quotations'] });
    queryClient.invalidateQueries({ queryKey: ['quotation'] });
    queryClient.invalidateQueries({ queryKey: ['enquiry'] });
    queryClient.invalidateQueries({ queryKey: ['enquiries'] });
    queryClient.invalidateQueries({ queryKey: ['order'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['payment-tracker'] });
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateQuotationInput) => quotationService.create(input),
    onSuccess: invalidateAfterSave,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateQuotationInput) => quotationService.update(quotationId!, input),
    onSuccess: invalidateAfterSave,
  });

  const saving = createMutation.isPending || updateMutation.isPending;

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
      if (quotationId) {
        const updated = await updateMutation.mutateAsync({
          // Only sent when it actually moved — an unchanged status would log a redundant status
          // change on the quotation's timeline for every ordinary edit.
          status: status !== existingQuotation?.status ? status : undefined,
          quotationDate: quotationDate || undefined,
          cgstPercent: totals.cgstPercent,
          sgstPercent: totals.sgstPercent,
          items: parsed.items,
        });
        showToast(`Quotation ${updated.quotationNumber} updated.`);
        onSaved(updated);
        return;
      }

      const created = await createMutation.mutateAsync({
        source: 'ENQUIRY',
        enquiryId: enquiry.id,
        // REVISED is never offered on create (statusOptions), so this is always a value the API takes.
        status: status === 'REVISED' ? undefined : status,
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
        setServerError(`Unable to ${quotationId ? 'save' : 'create'} the quotation. Please try again.`);
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth={previewOpen ? 'lg' : 'md'}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RequestQuoteIcon fontSize="small" />
        {isEdit ? `Edit Quotation${existingQuotation ? ` ${existingQuotation.quotationNumber}` : ''}` : 'Create Quotation'}
        <Button
          variant="outlined"
          size="small"
          startIcon={previewOpen ? <VisibilityOffIcon /> : <VisibilityIcon />}
          onClick={() => setPreviewOpen((prev) => !prev)}
          sx={{ ml: 'auto' }}
        >
          {previewOpen ? 'Hide Preview' : 'Show Preview'}
        </Button>
      </DialogTitle>
      <DialogContent dividers>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            {isEdit && isLoadingQuotation && <Alert severity="info">Loading the quotation…</Alert>}

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
                onChange={(event) => setStatus(event.target.value as QuotationStatus)}
                helperText={
                  canApprove
                    ? 'The status this quotation is saved in.'
                    : 'Approving a quotation needs the Approve permission.'
                }
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option} disabled={option === 'APPROVED' && !canApprove}>
                    {resolveStatusConfig('quotation', option).label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {status === 'APPROVED' && existingQuotation?.status !== 'APPROVED' && (
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

            {!isEdit && (
              <Typography variant="caption" color="text.secondary">
                Sample decor images can be added once the quotation is saved.
              </Typography>
            )}
          </Stack>

          {previewOpen && (
            <Box sx={{ flex: 1, minWidth: 0, maxWidth: { lg: 460 } }}>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Live Preview
              </Typography>
              <Box sx={{ maxHeight: 560, overflowY: 'auto', pr: 0.5 }}>
                <QuotationPreview
                  company={branding}
                  recipient={previewRecipient}
                  quotationNumber={existingQuotation ? existingQuotation.quotationNumber : 'Auto-generated'}
                  quotationDate={quotationDate ? formatDate(quotationDate) : formatDate(todayISO())}
                  items={items
                    .filter((item) => item.itemName.trim() !== '')
                    .map((item) => ({
                      itemName: item.itemName,
                      quantity: Number(item.quantity) || 0,
                      rate: Number(item.rate) || 0,
                      amount: (Number(item.quantity) || 0) * (Number(item.rate) || 0),
                    }))}
                  subtotal={totals.subtotal}
                  cgstPercent={totals.cgstPercent}
                  sgstPercent={totals.sgstPercent}
                  cgstAmount={totals.cgstAmount}
                  sgstAmount={totals.sgstAmount}
                  total={totals.total}
                  images={[]}
                />
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !enquiry || (isEdit && !existingQuotation)}
        >
          {saving ? 'Saving…' : 'Save Quotation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
