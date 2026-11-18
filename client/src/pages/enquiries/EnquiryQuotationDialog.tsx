import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
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
import { formatDate, getPublicAssetUrl } from '../../utils/format';
import { QUOTATION_CREATE_STATUSES, QUOTATION_EDIT_STATUSES } from '../../validation/quotationSchemas';
import { ImageThumb } from '../quotations/ImageThumb';
import { SavedImageThumb } from '../quotations/SavedImageThumb';
import {
  setStagedCaption,
  stageQuotationImages,
  useStagedImageUrls,
  type StagedQuotationImage,
} from '../quotations/quotationImages';
import QuotationPreview from '../quotations/QuotationPreview';
import { QuotationItemsEditor } from '../quotations/QuotationItemsEditor';
import { QuotationSectionsEditor } from '../quotations/QuotationSectionsEditor';
import {
  EMPTY_QUOTATION_DRAFT_ITEM,
  newQuotationSectionDraft,
  quotationDraftTotals,
  quotationSectionsToDrafts,
  quotationSectionTotals,
  toQuotationItemsInput,
  toQuotationSectionsInput,
  type QuotationDraftItem,
  type QuotationSectionDraft,
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
    eventDate: string | null;
    /** The enquiry's Final Budget advance, used to seed a new quotation so both stay in step. */
    advanceAmount: string | null;
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
  // New quotations are section-wise; one saved with flat priced items keeps the item table when edited.
  const [sections, setSections] = useState<QuotationSectionDraft[]>(() => [newQuotationSectionDraft()]);
  const [cgstPercent, setCgstPercent] = useState('');
  const [sgstPercent, setSgstPercent] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [quotationDate, setQuotationDate] = useState(todayISO);
  const [status, setStatus] = useState<QuotationStatus>('DRAFT');
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  // Shown by default — mirrors the Quotation form's live preview so this dialog produces the same
  // WYSIWYG check before saving.
  const [previewOpen, setPreviewOpen] = useState(true);
  const [stagedImages, setStagedImages] = useState<StagedQuotationImage[]>([]);
  // Object URLs for previewing staged (not-yet-uploaded) images.
  const stagedUrls = useStagedImageUrls(stagedImages);

  const isEdit = Boolean(quotationId);
  const enquiryAdvanceAmount = enquiry?.advanceAmount ?? null;

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
      setSections([newQuotationSectionDraft()]);
      setCgstPercent('');
      setSgstPercent('');
      setAdvanceAmount(
        enquiryAdvanceAmount && Number(enquiryAdvanceAmount) > 0 ? enquiryAdvanceAmount : '',
      );
      setQuotationDate(todayISO());
      setStagedImages([]);
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
    setSections(
      existingQuotation.sections.length > 0
        ? quotationSectionsToDrafts(existingQuotation.sections)
        : [newQuotationSectionDraft()],
    );
    setCgstPercent(Number(existingQuotation.cgstPercent) ? existingQuotation.cgstPercent : '');
    setSgstPercent(Number(existingQuotation.sgstPercent) ? existingQuotation.sgstPercent : '');
    // The quotation's own advance wins; a quotation that never carried one inherits the enquiry's
    // Final Budget advance so editing it cannot quietly reset that figure to zero.
    setAdvanceAmount(
      existingQuotation.advanceAmount && Number(existingQuotation.advanceAmount) > 0
        ? existingQuotation.advanceAmount
        : enquiryAdvanceAmount && Number(enquiryAdvanceAmount) > 0
          ? enquiryAdvanceAmount
          : '',
    );
    setQuotationDate(existingQuotation.quotationDate.slice(0, 10));
    setStatus(existingQuotation.status);
    setItemsError(null);
    setServerError(null);
    setPreviewOpen(true);
  }, [open, quotationId, existingQuotation, enquiryAdvanceAmount]);

  // REVISED is only offered on a quotation that already carries it — it is a state the server sets
  // when a revision supersedes one, not an ordinary pick.
  const statusOptions = (isEdit ? QUOTATION_EDIT_STATUSES : QUOTATION_CREATE_STATUSES).filter(
    (option) => option !== 'REVISED' || existingQuotation?.status === 'REVISED',
  );

  // Editing keeps the layout the quotation was saved in, so a flat quotation is never silently converted.
  const useSections = !isEdit || (existingQuotation?.sections.length ?? 0) > 0;
  const totals = useSections
    ? quotationSectionTotals(sections, cgstPercent, sgstPercent)
    : quotationDraftTotals(items, cgstPercent, sgstPercent);

  // Sections that have been started, in the preview's shape; an untouched blank one is left out.
  const previewSections = useSections
    ? sections
        .map((section) => ({
          title: section.title.trim() || null,
          amount: Number(section.amount) || 0,
          items: section.items
            .filter((item) => item.description.trim() !== '')
            .map((item) => ({ description: item.description, sizeQty: item.sizeQty.trim() || null })),
        }))
        .filter((section) => section.items.length > 0 || section.title || section.amount > 0)
    : [];

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

  // Both paths touch the same records, so they share one refresh: confirming a quotation re-sums the
  // enquiry's final budget, and editing a confirmed one moves that figure and the total of an order
  // already raised (quotations/service.ts create/update). Neither moves the enquiry's own status.
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

  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => quotationService.uploadImages(quotationId!, files.map((file) => ({ file }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] });
      showToast('Images added.');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => quotationService.deleteImage(quotationId!, imageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] }),
  });

  async function handleImageFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    if (quotationId) {
      try {
        await uploadImagesMutation.mutateAsync(files);
      } catch (error) {
        if (isAxiosError<ApiErrorResponse>(error) && error.response) showToast(error.response.data.message, 'error');
        else showToast('Unable to upload images.', 'error');
      }
    } else {
      // No quotation ID yet, so the files are held and uploaded right after the quotation is created.
      setStagedImages((prev) => stageQuotationImages(prev, files));
    }
  }

  async function handleSave() {
    if (!enquiry) return;
    setServerError(null);
    setItemsError(null);

    // The lines to save: sections for a section-wise quotation, otherwise the flat priced items.
    let lines: Pick<CreateQuotationInput, 'items' | 'sections'>;
    if (useSections) {
      const parsed = toQuotationSectionsInput(sections, 'Add at least one item.');
      if (parsed.sections === null) {
        setItemsError(parsed.error);
        return;
      }
      lines = { sections: parsed.sections };
    } else {
      const parsed = toQuotationItemsInput(items, 'Add at least one item.');
      if (parsed.items === null) {
        setItemsError(parsed.error);
        return;
      }
      lines = { items: parsed.items };
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
          advanceAmount: Number(advanceAmount) || 0,
          ...lines,
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
        advanceAmount: Number(advanceAmount) || 0,
        ...lines,
      });
      if (stagedImages.length) {
        try {
          await quotationService.uploadImages(created.id, stagedImages);
        } catch {
          showToast('Quotation saved, but some images failed to upload.', 'error');
        }
      }
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
                label="Event Date"
                fullWidth
                value={enquiry?.eventDate ? formatDate(enquiry.eventDate) : 'Not set'}
                slotProps={{ input: { readOnly: true } }}
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
              <Alert severity="info">
                Saving as Confirmed sets the enquiry's final budget from the confirmed quotations. The
                enquiry's own status is left as it is — move it to Order Confirmed to raise the order.
              </Alert>
            )}

            {useSections ? (
              <QuotationSectionsEditor
                sections={sections}
                onSectionsChange={(next) => {
                  setSections(next);
                  setItemsError(null);
                }}
                cgstPercent={cgstPercent}
                sgstPercent={sgstPercent}
                onCgstChange={setCgstPercent}
                onSgstChange={setSgstPercent}
                totals={totals}
                error={itemsError}
                advanceAmount={advanceAmount}
                onAdvanceChange={setAdvanceAmount}
              />
            ) : (
              <QuotationItemsEditor
                items={items}
                onItemsChange={setItems}
                cgstPercent={cgstPercent}
                sgstPercent={sgstPercent}
                onCgstChange={setCgstPercent}
                onSgstChange={setSgstPercent}
                totals={totals}
                error={itemsError}
                advanceAmount={advanceAmount}
                onAdvanceChange={setAdvanceAmount}
              />
            )}

            <Box>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<AddPhotoAlternateIcon />}
                  disabled={uploadImagesMutation.isPending || saving || (isEdit && !existingQuotation)}
                >
                  {uploadImagesMutation.isPending ? 'Uploading…' : 'Add Sample Decor Images'}
                  <input hidden type="file" accept="image/jpeg,image/png" multiple onChange={handleImageFiles} />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  JPEG or PNG, up to 12 images.
                </Typography>
              </Stack>
              {(isEdit ? (existingQuotation?.images.length ?? 0) : stagedImages.length) > 0 && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 1.5,
                    mt: 2,
                  }}
                >
                  {isEdit
                    ? (existingQuotation?.images ?? []).map((image) => (
                        <SavedImageThumb
                          key={image.id}
                          quotationId={quotationId!}
                          image={image}
                          onRemove={() => deleteImageMutation.mutate(image.id)}
                        />
                      ))
                    : stagedUrls.map((url, index) => (
                        <ImageThumb
                          key={url}
                          src={url}
                          alt={`decor ${index + 1}`}
                          caption={stagedImages[index]?.caption ?? ''}
                          onCaptionChange={(value) => setStagedImages((prev) => setStagedCaption(prev, index, value))}
                          onRemove={() => setStagedImages((prev) => prev.filter((_, i) => i !== index))}
                        />
                      ))}
                </Box>
              )}
              {!isEdit && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Images upload automatically when you save the quotation.
                </Typography>
              )}
            </Box>
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
                  quotationDate={enquiry?.eventDate ? formatDate(enquiry.eventDate) : ''}
                  sections={previewSections}
                  totalInWords={isEdit ? existingQuotation?.totalAmountInWords : undefined}
                  items={useSections
                    ? []
                    : items
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
                  advanceAmount={Number(advanceAmount) || 0}
                  images={
                    isEdit
                      ? (existingQuotation?.images ?? []).map((image) => ({
                          src: getPublicAssetUrl(image.filePath),
                          caption: image.caption,
                        }))
                      : stagedUrls.map((url, index) => ({ src: url, caption: stagedImages[index]?.caption || null }))
                  }
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
