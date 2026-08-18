import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FormPage } from '../../components/FormPage';
import { FormSection } from '../../components/FormSection';
import { resolveStatusConfig } from '../../components/statusConfig';
import { SCROLL_ANCHORS } from '../../constants/scrollAnchors';
import { usePermission } from '../../hooks/usePermission';
import { useRouteId } from '../../hooks/useRouteId';
import QuotationPreview from './QuotationPreview';
import * as customerService from '../../services/customerService';
import * as enquiryService from '../../services/enquiryService';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type { CustomerOption } from '../../types/masters';
import type {
  CreateQuotationInput,
  ManualCustomerInput,
  QuotationRecipient,
  UpdateQuotationInput,
} from '../../types/quotation';
import { formatCurrency, formatDate, getPublicAssetUrl } from '../../utils/format';
import { fromId, toId, toOptionalId } from '../../utils/ids';
import {
  QUOTATION_CREATE_STATUSES,
  QUOTATION_EDIT_STATUSES,
  QUOTATION_FORM_SOURCES,
  quotationFormSchema,
  type QuotationFormSource,
  type QuotationFormValues,
} from '../../validation/quotationSchemas';

const EMPTY_ITEM = { itemName: '', quantity: '', rate: '' };

const SOURCE_LABELS: Record<QuotationFormSource, { label: string; hint: string }> = {
  ENQUIRY: { label: 'Existing Enquiry', hint: 'Price an enquiry already in the pipeline. The quotation is versioned against it.' },
  CUSTOMER: { label: 'Existing Customer', hint: 'Quote a customer on the master directly, without an enquiry.' },
  MANUAL: { label: 'Manual', hint: 'Quote someone who is not on record yet — their details are captured on the quotation.' },
};
const EMPTY_RECIPIENT: QuotationRecipient = {
  name: null,
  phone: null,
  whatsapp: null,
  email: null,
  address: null,
  gst: null,
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function QuotationFormPage() {
  const id = useRouteId();
  const [searchParams] = useSearchParams();
  const prefillEnquiryId = searchParams.get('enquiryId');
  const prefillCustomerId = searchParams.get('customerId');
  const isEdit = Boolean(id);
  // The source pickers are fixed (not searchable) in edit mode or when the page was opened from a
  // specific record's context — the customer of a saved quotation can never change.
  const detailsLocked = isEdit || Boolean(prefillEnquiryId) || Boolean(prefillCustomerId);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  // Mirrors the API guard on the create/update routes: APPROVED is the one status that answers to
  // the Approve permission rather than to Create/Edit.
  const canApprove = usePermission('QUOTATIONS', 'canApprove');

  // This page is opened from several places (Quotations list, Enquiry form, Order tab, ...), so
  // "back" means wherever the user actually came from rather than a single hardcoded route.
  // `location.key === 'default'` only when there's no in-app history to return to (e.g. a direct
  // URL load), in which case falling back to the Quotations list keeps Cancel/Save from stranding
  // the user on a dead end.
  function goBack() {
    if (location.key === 'default') navigate('/quotations');
    else navigate(-1);
  }

  const [serverError, setServerError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [enquirySearch, setEnquirySearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [pickedRecipient, setPickedRecipient] = useState<QuotationRecipient | null>(null);
  // Hidden: the item-entry form takes the full page width, better suited for adding many rows.
  // Shown (default): the two-column layout with the live preview beside it.
  const [previewOpen, setPreviewOpen] = useState(true);
  // In create mode there is no quotation ID yet, so chosen images are held here and uploaded right
  // after the quotation is saved.
  const [stagedImages, setStagedImages] = useState<File[]>([]);

  const { data: existingQuotation } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.getById(id),
    enabled: isEdit,
  });

  // Company letterhead + bank details for the live preview (mirrors the printed PDF).
  const { data: branding } = useQuery({
    queryKey: ['quotation-branding'],
    queryFn: () => quotationService.getBranding(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      source: prefillCustomerId ? 'CUSTOMER' : 'ENQUIRY',
      status: 'DRAFT',
      enquiryId: '',
      customerId: '',
      manualName: '',
      manualPhone: '',
      manualWhatsapp: '',
      manualEmail: '',
      manualAddress: '',
      manualGst: '',
      quotationDate: todayISO(),
      cgstPercent: '',
      sgstPercent: '',
      items: [{ ...EMPTY_ITEM }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const source = watch('source');
  const status = watch('status');
  // REVISED describes a quotation superseded by a newer revision, so it is only meaningful on one
  // that already exists.
  const statusOptions = isEdit ? QUOTATION_EDIT_STATUSES : QUOTATION_CREATE_STATUSES;

  // Search Enquiry dropdown — loads recent enquiries and filters by number / customer / mobile.
  const { data: enquiryResults } = useQuery({
    queryKey: ['enquiries', 'search', enquirySearch],
    queryFn: () => enquiryService.list({ page: 1, limit: 20, search: enquirySearch || undefined }),
    enabled: !detailsLocked && source === 'ENQUIRY',
  });

  // Search Customer dropdown — same shape, over the customer master.
  const { data: customerResults } = useQuery({
    queryKey: ['customers', 'search', customerSearch.trim()],
    queryFn: () => customerService.search(customerSearch),
    enabled: !detailsLocked && source === 'CUSTOMER',
    placeholderData: (previous) => previous,
  });

  // Preselect when opened from a record's context (?enquiryId=... / ?customerId=...).
  useEffect(() => {
    if (isEdit) return;
    if (prefillEnquiryId) {
      setValue('source', 'ENQUIRY');
      setValue('enquiryId', prefillEnquiryId);
    } else if (prefillCustomerId) {
      setValue('source', 'CUSTOMER');
      setValue('customerId', prefillCustomerId);
    }
  }, [isEdit, prefillEnquiryId, prefillCustomerId, setValue]);

  const selectedEnquiryId = watch('enquiryId');
  const selectedCustomerId = watch('customerId');

  // Detail of the picked enquiry, to auto-fill address into the preview (name/mobile come from the
  // dropdown selection immediately; the detail call enriches with address when available).
  const { data: selectedEnquiry } = useQuery({
    queryKey: ['enquiry-detail', selectedEnquiryId],
    queryFn: () => enquiryService.getById(toId(selectedEnquiryId!)),
    enabled: !isEdit && source === 'ENQUIRY' && Boolean(selectedEnquiryId),
  });

  // Same purpose for a customer-sourced quotation: the picker gives name/mobile immediately, the
  // detail call enriches the preview with email and address.
  const { data: selectedCustomer } = useQuery({
    queryKey: ['customer', selectedCustomerId],
    queryFn: () => customerService.getById(toId(selectedCustomerId!)),
    enabled: !isEdit && source === 'CUSTOMER' && Boolean(selectedCustomerId),
  });

  useEffect(() => {
    if (!existingQuotation) return;
    reset({
      // The picker is hidden in edit mode (the customer of a saved quotation can't change), so
      // this only seeds the field. ORDER-sourced quotations aren't raised from this form and fall
      // back to ENQUIRY — nothing reads the value except the MANUAL customer-details section,
      // which is gated on the saved quotation's own source rather than on this.
      source:
        existingQuotation.source === 'CUSTOMER' || existingQuotation.source === 'MANUAL'
          ? existingQuotation.source
          : 'ENQUIRY',
      status: existingQuotation.status,
      enquiryId: fromId(existingQuotation.link.enquiry?.id),
      customerId: fromId(existingQuotation.link.customer?.id),
      manualName: existingQuotation.recipient.name ?? '',
      manualPhone: existingQuotation.recipient.phone ?? '',
      manualWhatsapp: existingQuotation.recipient.whatsapp ?? '',
      manualEmail: existingQuotation.recipient.email ?? '',
      manualAddress: existingQuotation.recipient.address ?? '',
      manualGst: existingQuotation.recipient.gst ?? '',
      quotationDate: existingQuotation.quotationDate.slice(0, 10),
      cgstPercent: Number(existingQuotation.cgstPercent) > 0 ? existingQuotation.cgstPercent : '',
      sgstPercent: Number(existingQuotation.sgstPercent) > 0 ? existingQuotation.sgstPercent : '',
      items: existingQuotation.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        rate: item.rate,
      })),
    });
  }, [existingQuotation, reset]);

  // useWatch gives live, re-rendering values for the item rows (drives totals, preview, auto-row).
  const items = (useWatch({ control, name: 'items' }) ?? []) as QuotationFormValues['items'];
  const quotationDate = watch('quotationDate');
  const cgstValue = watch('cgstPercent');
  const sgstValue = watch('sgstPercent');

  const itemsSubtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0,
  );
  const cgstPercentNum = Number(cgstValue) || 0;
  const sgstPercentNum = Number(sgstValue) || 0;
  const cgstAmount = Math.round(((itemsSubtotal * cgstPercentNum) / 100) * 100) / 100;
  const sgstAmount = Math.round(((itemsSubtotal * sgstPercentNum) / 100) * 100) / 100;
  const grandTotal = itemsSubtotal + cgstAmount + sgstAmount;

  // Object URLs for previewing staged (not-yet-uploaded) images; revoked when the set changes.
  const stagedUrls = useMemo(() => stagedImages.map((file) => URL.createObjectURL(file)), [stagedImages]);
  useEffect(() => () => stagedUrls.forEach((url) => URL.revokeObjectURL(url)), [stagedUrls]);

  // Appends a fresh empty row the moment the current last row gets an item name — the "auto add
  // next row" behaviour of UIEnhance.md §4. The Add Row button below the table covers the same
  // ground for anyone who expects an explicit control.
  function maybeAppendRow(index: number, value: string) {
    if (index === fields.length - 1 && value.trim() !== '') {
      append({ ...EMPTY_ITEM }, { shouldFocus: false });
    }
  }

  // Manual details are typed straight into the form, so the preview reads them live rather than
  // waiting for a lookup.
  const manualName = watch('manualName');
  const manualPhone = watch('manualPhone');
  const manualWhatsapp = watch('manualWhatsapp');
  const manualEmail = watch('manualEmail');
  const manualAddress = watch('manualAddress');
  const manualGst = watch('manualGst');

  const previewRecipient: QuotationRecipient = useMemo(() => {
    if (source === 'MANUAL') {
      return {
        name: manualName || null,
        phone: manualPhone || null,
        whatsapp: manualWhatsapp || null,
        email: manualEmail || null,
        address: manualAddress || null,
        gst: manualGst || null,
      };
    }
    if (isEdit && existingQuotation) return existingQuotation.recipient;
    if (source === 'ENQUIRY' && selectedEnquiry) {
      return {
        name: selectedEnquiry.customer.customerName,
        phone: selectedEnquiry.customer.mobile,
        whatsapp: selectedEnquiry.prospect?.whatsapp ?? selectedEnquiry.customer.mobile,
        email: selectedEnquiry.prospect?.email ?? null,
        address: selectedEnquiry.prospect?.address ?? null,
        gst: null,
      };
    }
    if (source === 'CUSTOMER' && selectedCustomer) {
      return {
        name: selectedCustomer.customerName,
        phone: selectedCustomer.mobile,
        whatsapp: selectedCustomer.whatsapp ?? selectedCustomer.mobile,
        email: selectedCustomer.email ?? null,
        address: selectedCustomer.address ?? null,
        gst: null,
      };
    }
    return pickedRecipient ?? EMPTY_RECIPIENT;
  }, [
    source,
    manualName,
    manualPhone,
    manualWhatsapp,
    manualEmail,
    manualAddress,
    manualGst,
    isEdit,
    existingQuotation,
    selectedEnquiry,
    selectedCustomer,
    pickedRecipient,
  ]);

  const createMutation = useMutation({
    mutationFn: (input: CreateQuotationInput) => quotationService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      // Saving straight into Approved re-sums the enquiry's final budget server-side (and the total of
      // an order already raised from it), so the same lists the update path refreshes are refreshed here.
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['payment-tracker'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateQuotationInput) => quotationService.update(id, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      // Saving an approved quotation also moves the linked order's total/balance and the enquiry's
      // final budget (quotations/service.ts update()). Invalidated by key prefix because the form
      // doesn't know which order or enquiry the server touched.
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['order-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      showToast(`Quotation ${updated.quotationNumber} updated.`);
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => quotationService.uploadImages(id, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      showToast('Images added.');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => quotationService.deleteImage(id, imageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotation', id] }),
  });

  async function handleImageFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    if (isEdit) {
      try {
        await uploadImagesMutation.mutateAsync(files);
      } catch (error) {
        if (isAxiosError<ApiErrorResponse>(error) && error.response) showToast(error.response.data.message, 'error');
        else showToast('Unable to upload images.', 'error');
      }
    } else {
      // Stage for upload after the quotation is created (cap at 12 total).
      setStagedImages((prev) => [...prev, ...files].slice(0, 12));
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  // Deferred so the row has rendered before we reach for its input.
  function focusItemInput(index: number) {
    setTimeout(() => {
      document.querySelector<HTMLInputElement>(`[data-item-input="${index}"]`)?.focus();
    }, 0);
  }

  // Enter / ArrowDown jumps to the next row's Item field. A filled row already spawns a trailing
  // empty row via the effect above, so we only need to move focus.
  function handleItemKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusItemInput(index + 1);
    }
  }

  // Explicit "Add Row", alongside the type-to-append behaviour. When the last row is still blank
  // there is nothing to add — focus it instead, so the button never stacks empty rows.
  function handleAddRow() {
    const lastIndex = fields.length - 1;
    const lastRowIsBlank = !items[lastIndex]?.itemName?.trim();
    if (!lastRowIsBlank) {
      append({ ...EMPTY_ITEM }, { shouldFocus: false });
      focusItemInput(fields.length);
      return;
    }
    focusItemInput(lastIndex);
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setItemsError(null);

    const validItems = values.items.filter((item) => item.itemName.trim() !== '');
    if (validItems.length === 0) {
      setItemsError('Add at least one item.');
      return;
    }
    const invalid = validItems.some((item) => !(Number(item.quantity) > 0) || !(Number(item.rate) >= 0));
    if (invalid) {
      setItemsError('Enter a valid quantity and unit price for every item.');
      return;
    }

    const itemsInput = validItems.map((item, index) => ({
      itemName: item.itemName.trim(),
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      sortOrder: index,
    }));

    const cgstPercent = values.cgstPercent ? Number(values.cgstPercent) : 0;
    const sgstPercent = values.sgstPercent ? Number(values.sgstPercent) : 0;

    // Only a MANUAL quotation carries a customer snapshot — the API rejects one on any other
    // source, and rejects a manual quotation without a WhatsApp number (enforced by the schema).
    const manualCustomer: ManualCustomerInput | undefined =
      values.source === 'MANUAL'
        ? {
            name: values.manualName || undefined,
            phone: values.manualPhone || undefined,
            whatsapp: values.manualWhatsapp!,
            email: values.manualEmail || undefined,
            address: values.manualAddress || undefined,
            gst: values.manualGst || undefined,
          }
        : undefined;

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          // Only sent when it actually moved — an unchanged status would make the API log a
          // redundant status change on the quotation's timeline for every ordinary edit.
          status: values.status !== existingQuotation?.status ? values.status : undefined,
          quotationDate: values.quotationDate || undefined,
          cgstPercent,
          sgstPercent,
          items: itemsInput,
          ...(existingQuotation?.source === 'MANUAL' ? { manualCustomer } : {}),
        });
        goBack();
      } else {
        const created = await createMutation.mutateAsync({
          source: values.source,
          // REVISED is not offered on create (see QUOTATION_CREATE_STATUSES), so the value here is
          // always one the API accepts on a new quotation.
          status: values.status === 'REVISED' ? undefined : values.status,
          enquiryId: values.source === 'ENQUIRY' ? toOptionalId(values.enquiryId) : undefined,
          customerId: values.source === 'CUSTOMER' ? toOptionalId(values.customerId) : undefined,
          manualCustomer,
          quotationDate: values.quotationDate || undefined,
          cgstPercent,
          sgstPercent,
          items: itemsInput,
        });
        if (stagedImages.length) {
          try {
            await quotationService.uploadImages(created.id, stagedImages);
          } catch {
            showToast('Quotation saved, but some images failed to upload.', 'error');
          }
        }
        showToast(`Quotation ${created.quotationNumber} created.`);
        // Land on the quotation's own view page, where every follow-up action (share, revise,
        // approve, convert) now lives.
        navigate(`/quotations/${created.id}`, { replace: true });
      }
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Unable to save quotation. Please try again.');
      }
    }
  });

  async function handleDownload() {
    if (!existingQuotation) return;
    try {
      await quotationService.downloadPdf(
        existingQuotation.id,
        `${existingQuotation.quotationNumber}-v${existingQuotation.version}.pdf`,
      );
    } catch {
      showToast('Unable to download the quotation PDF.', 'error');
    }
  }

  async function handlePrint() {
    if (!existingQuotation) return;
    try {
      await quotationService.openPdf(existingQuotation.id);
    } catch {
      showToast('Unable to open the quotation PDF.', 'error');
    }
  }

  function handleWhatsApp() {
    if (!existingQuotation) return;
    const number = (existingQuotation.whatsappNumber ?? '').replace(/\D/g, '');
    if (!number) {
      showToast('No WhatsApp number is available for this quotation.', 'error');
      return;
    }
    const name = existingQuotation.recipient.name ?? 'there';
    const message = `Hello ${name}, thank you for contacting us. Please find your quotation ${existingQuotation.quotationNumber}. Regards.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }

  const imagesSection = (
    <FormSection
      title="Sample Decor Images"
      subtitle="Shown to the customer and added to the quotation PDF on a single page."
    >
      <Box sx={{ gridColumn: '1 / -1' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<AddPhotoAlternateIcon />}
            disabled={uploadImagesMutation.isPending}
          >
            {uploadImagesMutation.isPending ? 'Uploading…' : 'Add Images'}
            <input hidden type="file" accept="image/jpeg,image/png" multiple onChange={handleImageFiles} />
          </Button>
          <Typography variant="caption" color="text.secondary">
            JPEG or PNG, up to 12 images.
          </Typography>
        </Stack>

        {(isEdit ? (existingQuotation?.images.length ?? 0) : stagedImages.length) > 0 ? (
          <Box
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1.5, mt: 2 }}
          >
            {isEdit
              ? (existingQuotation?.images ?? []).map((image) => (
                  <ImageThumb
                    key={image.id}
                    src={getPublicAssetUrl(image.filePath)}
                    alt={image.fileName}
                    onRemove={() => deleteImageMutation.mutate(image.id)}
                  />
                ))
              : stagedUrls.map((url, index) => (
                  <ImageThumb
                    key={url}
                    src={url}
                    alt={`decor ${index + 1}`}
                    onRemove={() => setStagedImages((prev) => prev.filter((_, i) => i !== index))}
                  />
                ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {isEdit ? 'No images added yet.' : 'Add images now — they upload automatically when you save.'}
          </Typography>
        )}
      </Box>
    </FormSection>
  );

  const previewPanel = (
    <>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5, flexShrink: 0 }}>
        Live Preview
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
        <QuotationPreview
          company={branding}
          recipient={previewRecipient}
          quotationNumber={existingQuotation?.quotationNumber ?? 'Auto-generated'}
          quotationDate={quotationDate ? formatDate(quotationDate) : formatDate(todayISO())}
          items={items
            .filter((item) => item.itemName.trim() !== '')
            .map((item) => ({
              itemName: item.itemName,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.rate) || 0,
              amount: (Number(item.quantity) || 0) * (Number(item.rate) || 0),
            }))}
          subtotal={itemsSubtotal}
          cgstPercent={cgstPercentNum}
          sgstPercent={sgstPercentNum}
          cgstAmount={cgstAmount}
          sgstAmount={sgstAmount}
          total={grandTotal}
          images={isEdit ? (existingQuotation?.images ?? []).map((image) => getPublicAssetUrl(image.filePath)) : stagedUrls}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', flexShrink: 0 }}>
        The server recalculates totals and generates a print-ready PDF on save.
      </Typography>
    </>
  );

  // What the read-only "who is this for" block shows when the customer can no longer be chosen:
  // the saved quotation's own recipient in edit mode, or the pre-selected record's details when
  // the page was opened from an enquiry/customer context.
  const lockedSummary = (() => {
    if (isEdit) {
      return {
        name: existingQuotation?.recipient.name ?? '—',
        phone: existingQuotation?.recipient.phone ?? '',
        caption: existingQuotation?.link.enquiry
          ? `Enquiry ${existingQuotation.link.enquiry.enquiryNumber}`
          : 'The customer cannot be changed after a quotation is created.',
      };
    }
    if (prefillCustomerId) {
      return {
        name: selectedCustomer?.customerName ?? '—',
        phone: selectedCustomer?.mobile ?? '',
        caption: selectedCustomer ? `Customer ${selectedCustomer.customerCode} — pre-selected.` : 'Loading customer…',
      };
    }
    return {
      name: selectedEnquiry?.customer.customerName ?? '—',
      phone: selectedEnquiry?.customer.mobile ?? '',
      caption: selectedEnquiry ? `Enquiry ${selectedEnquiry.enquiryNumber} — pre-selected.` : 'Loading enquiry…',
    };
  })();

  const previewToggleButton = (
    <Button
      variant="outlined"
      size="small"
      startIcon={previewOpen ? <VisibilityOffIcon /> : <VisibilityIcon />}
      onClick={() => setPreviewOpen((prev) => !prev)}
    >
      {previewOpen ? 'Hide Preview' : 'Show Preview'}
    </Button>
  );

  return (
    <FormPage
      breadcrumbs={[
        { label: 'Dashboard', to: '/' },
        { label: 'Quotations', to: '/quotations' },
        { label: isEdit ? 'Edit Quotation' : 'New Quotation' },
      ]}
      title={isEdit ? `Edit Quotation${existingQuotation ? ` (v${existingQuotation.version})` : ''}` : 'New Quotation'}
      subtitle={isEdit ? 'Update quotation items and date.' : 'Search an enquiry, add items, and save.'}
      onCancel={goBack}
      onSave={onSubmit}
      saving={saving || isSubmitting}
      saveLabel={isEdit ? 'Update Quotation' : 'Save Quotation'}
      isDirty={isDirty}
      serverError={serverError}
      headerActions={previewToggleButton}
      sidePanel={previewOpen ? previewPanel : undefined}
      sidePanelWidth={520}
      sidePanelMinWidth={380}
      sidePanelMaxWidth={820}
      sidePanelStorageKey="quotation-preview-width"
      maxWidth={previewOpen ? undefined : 1300}
    >
      {isEdit && existingQuotation?.status === 'APPROVED' && (
        <Box sx={{ gridColumn: '1 / -1', mb: 2 }}>
          <Alert severity="info">
            This quotation is approved. Saving changes updates the linked order's total and balance —
            payments already received are not affected.
          </Alert>
        </Box>
      )}

      {isEdit && existingQuotation && (
        <FormSection title="Actions">
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}>
                Download PDF
              </Button>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
                Print
              </Button>
              <Button
                variant="outlined"
                startIcon={<WhatsAppIcon />}
                disabled={
                  existingQuotation.status !== 'DRAFT' &&
                  existingQuotation.status !== 'SENT' &&
                  existingQuotation.status !== 'APPROVED'
                }
                sx={{ color: '#25D366', borderColor: '#25D366' }}
                onClick={handleWhatsApp}
              >
                Send WhatsApp
              </Button>
            </Stack>
          </Box>
        </FormSection>
      )}

      <FormSection title="Quotation Details">
        {/* Who the quotation is for. A saved quotation's customer can never change, and a page
            opened from a record's context already knows — both collapse to a read-only summary. */}
        {detailsLocked ? (
          <Paper variant="outlined" sx={{ p: 2, gridColumn: '1 / -1' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {lockedSummary.name}
              {lockedSummary.phone ? ` · ${lockedSummary.phone}` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lockedSummary.caption}
            </Typography>
          </Paper>
        ) : (
          <>
            <Controller
              name="source"
              control={control}
              render={({ field: sourceField }) => (
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={sourceField.value}
                  sx={{ gridColumn: '1 / -1' }}
                  onChange={(_event, value: QuotationFormSource | null) => {
                    if (!value) return;
                    sourceField.onChange(value);
                    // Clearing the other sources' links keeps a stale selection from being
                    // submitted after switching (the API rejects mismatched combinations).
                    setValue('enquiryId', '', { shouldDirty: true });
                    setValue('customerId', '', { shouldDirty: true });
                    setPickedRecipient(null);
                  }}
                >
                  {QUOTATION_FORM_SOURCES.map((option) => (
                    <ToggleButton key={option} value={option} sx={{ textTransform: 'none', px: 2 }}>
                      {SOURCE_LABELS[option].label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}
            />
            <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1 / -1', mt: -1 }}>
              {SOURCE_LABELS[source].hint}
            </Typography>

            {source === 'ENQUIRY' && (
              <Autocomplete
                sx={{ gridColumn: '1 / -1' }}
                options={enquiryResults?.records ?? []}
                getOptionLabel={(option) => `${option.enquiryNumber} — ${option.customer.customerName} — ${option.customer.mobile}`}
                filterOptions={(options) => options}
                onInputChange={(_event, value) => setEnquirySearch(value)}
                onChange={(_event, value) => {
                  setValue('enquiryId', fromId(value?.id), { shouldDirty: true });
                  setPickedRecipient(
                    value
                      ? {
                          name: value.customer.customerName,
                          phone: value.customer.mobile,
                          whatsapp: value.customer.mobile,
                          email: null,
                          address: null,
                          gst: null,
                        }
                      : null,
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    autoFocus
                    label="Search Enquiry"
                    placeholder="Search by enquiry no, customer, or mobile"
                    error={Boolean(errors.enquiryId)}
                    helperText={errors.enquiryId?.message ?? 'Selecting an enquiry auto-fills the customer details.'}
                  />
                )}
              />
            )}

            {source === 'CUSTOMER' && (
              <Autocomplete
                sx={{ gridColumn: '1 / -1' }}
                options={customerResults ?? []}
                getOptionLabel={(option: CustomerOption) =>
                  `${option.customerName} — ${option.mobile} (${option.customerCode})`
                }
                filterOptions={(options) => options}
                onInputChange={(_event, value) => setCustomerSearch(value)}
                onChange={(_event, value) => {
                  setValue('customerId', fromId(value?.id), { shouldDirty: true });
                  setPickedRecipient(
                    value
                      ? {
                          name: value.customerName,
                          phone: value.mobile,
                          whatsapp: value.mobile,
                          email: null,
                          address: null,
                          gst: null,
                        }
                      : null,
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    autoFocus
                    label="Search Customer"
                    placeholder="Search by name, mobile, or customer code"
                    error={Boolean(errors.customerId)}
                    helperText={errors.customerId?.message ?? 'Quotes an existing customer without creating an enquiry.'}
                  />
                )}
              />
            )}

            {source === 'MANUAL' && (
              <>
                <TextField
                  required
                  autoFocus
                  label="Customer Name"
                  fullWidth
                  error={Boolean(errors.manualName)}
                  helperText={errors.manualName?.message}
                  {...register('manualName')}
                />
                <TextField
                  required
                  label="WhatsApp Number"
                  fullWidth
                  error={Boolean(errors.manualWhatsapp)}
                  helperText={errors.manualWhatsapp?.message ?? 'The quotation is shared on this number.'}
                  {...register('manualWhatsapp')}
                />
                <TextField label="Phone" fullWidth {...register('manualPhone')} />
                <TextField
                  label="Email"
                  fullWidth
                  error={Boolean(errors.manualEmail)}
                  helperText={errors.manualEmail?.message}
                  {...register('manualEmail')}
                />
                <TextField label="GST Number" fullWidth {...register('manualGst')} />
                <TextField label="Address" fullWidth multiline rows={2} {...register('manualAddress')} />
              </>
            )}
          </>
        )}

        <TextField
          label="Quotation Date"
          type="date"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          {...register('quotationDate')}
        />

        <Controller
          name="status"
          control={control}
          render={({ field: statusField }) => (
            <TextField
              {...statusField}
              select
              label="Status"
              fullWidth
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
          )}
        />

        {/* Approving an enquiry-sourced quotation is the confirmation step of the workflow, not a
            label: the API runs the same action the Confirm button does — the enquiry's money, not its
            status. Said up front so nobody reaches it by accident from a dropdown. */}
        {status === 'APPROVED' && existingQuotation?.status !== 'APPROVED' && source === 'ENQUIRY' && (
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Alert severity="info">
              Saving as Confirmed sets the enquiry's final budget from the confirmed quotations, exactly
              as the Confirm Quotation action does. The enquiry's own status is left as it is — move it
              to Order Confirmed to raise the order.
            </Alert>
          </Box>
        )}
      </FormSection>

      {/* A manual quotation's customer lives on the quotation itself, so it stays correctable after
          saving — there is no Customer record to fix it on. */}
      {isEdit && existingQuotation?.source === 'MANUAL' && (
        <FormSection title="Customer Details" subtitle="Captured on this quotation — there is no linked customer record.">
          <TextField
            required
            label="Customer Name"
            fullWidth
            error={Boolean(errors.manualName)}
            helperText={errors.manualName?.message}
            {...register('manualName')}
          />
          <TextField
            required
            label="WhatsApp Number"
            fullWidth
            error={Boolean(errors.manualWhatsapp)}
            helperText={errors.manualWhatsapp?.message}
            {...register('manualWhatsapp')}
          />
          <TextField label="Phone" fullWidth {...register('manualPhone')} />
          <TextField
            label="Email"
            fullWidth
            error={Boolean(errors.manualEmail)}
            helperText={errors.manualEmail?.message}
            {...register('manualEmail')}
          />
          <TextField label="GST Number" fullWidth {...register('manualGst')} />
          <TextField label="Address" fullWidth multiline rows={2} {...register('manualAddress')} />
        </FormSection>
      )}

      {/* Anchor for links that open this form ready to add items (see SCROLL_ANCHORS). */}
      <FormSection title="Items" id={SCROLL_ANCHORS.quotationItems}>
        <Box sx={{ gridColumn: '1 / -1' }}>
          <TableContainer sx={{ maxHeight: 420, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 110 }} align="right">
                    Quantity
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 130 }} align="right">
                    Unit Price
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 130 }} align="right">
                    Sub Total
                  </TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, index) => {
                  const row = items[index];
                  const subtotal = (Number(row?.quantity) || 0) * (Number(row?.rate) || 0);
                  const isTrailingEmpty = index === fields.length - 1 && !row?.itemName?.trim();
                  return (
                    <TableRow key={field.id} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                      <TableCell>
                        <Controller
                          name={`items.${index}.itemName` as const}
                          control={control}
                          render={({ field: f }) => (
                            <TextField
                              {...f}
                              onChange={(event) => {
                                f.onChange(event);
                                maybeAppendRow(index, event.target.value);
                              }}
                              size="small"
                              fullWidth
                              placeholder={isTrailingEmpty ? 'Type to add an item…' : 'Item name'}
                              onKeyDown={(event) => handleItemKeyDown(event, index)}
                              slotProps={{ htmlInput: { 'data-item-input': index } }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ width: 120 }}>
                        <Controller
                          name={`items.${index}.quantity` as const}
                          control={control}
                          render={({ field: f }) => (
                            <TextField
                              {...f}
                              size="small"
                              type="number"
                              fullWidth
                              onKeyDown={(event) => handleItemKeyDown(event, index)}
                              slotProps={{ htmlInput: { style: { textAlign: 'right' }, min: 0 } }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ width: 140 }}>
                        <Controller
                          name={`items.${index}.rate` as const}
                          control={control}
                          render={({ field: f }) => (
                            <TextField
                              {...f}
                              size="small"
                              type="number"
                              fullWidth
                              onKeyDown={(event) => handleItemKeyDown(event, index)}
                              slotProps={{ htmlInput: { style: { textAlign: 'right' }, min: 0 } }}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ width: 140, fontWeight: 600 }}>
                        {subtotal ? formatCurrency(subtotal) : '—'}
                      </TableCell>
                      <TableCell sx={{ width: 48 }}>
                        {fields.length > 1 && !isTrailingEmpty && (
                          <IconButton size="small" title="Delete item" onClick={() => remove(index)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Button size="small" startIcon={<AddIcon />} onClick={handleAddRow} sx={{ mt: 1.5 }}>
            Add Row
          </Button>

          {itemsError && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {itemsError}
            </Typography>
          )}

          <Stack sx={{ mt: 2, alignItems: 'flex-end', gap: 1, pr: 1 }}>
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="CGST %"
                type="number"
                size="small"
                sx={{ width: 130 }}
                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01, style: { textAlign: 'right' } } }}
                {...register('cgstPercent')}
              />
              <TextField
                label="SGST %"
                type="number"
                size="small"
                sx={{ width: 130 }}
                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01, style: { textAlign: 'right' } } }}
                {...register('sgstPercent')}
              />
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body2" sx={{ minWidth: 140, textAlign: 'right' }}>
                {formatCurrency(itemsSubtotal)}
              </Typography>
            </Stack>
            {cgstPercentNum > 0 && (
              <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  CGST ({cgstPercentNum}%)
                </Typography>
                <Typography variant="body2" sx={{ minWidth: 140, textAlign: 'right' }}>
                  {formatCurrency(cgstAmount)}
                </Typography>
              </Stack>
            )}
            {sgstPercentNum > 0 && (
              <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  SGST ({sgstPercentNum}%)
                </Typography>
                <Typography variant="body2" sx={{ minWidth: 140, textAlign: 'right' }}>
                  {formatCurrency(sgstAmount)}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4">Grand Total</Typography>
              <Typography variant="h4" sx={{ minWidth: 140, textAlign: 'right' }}>
                {formatCurrency(grandTotal)}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </FormSection>

      {imagesSection}
    </FormPage>
  );
}

function ImageThumb({ src, alt, onRemove }: { src: string; alt: string; onRemove: () => void }) {
  return (
    <Box sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <Box component="img" src={src} alt={alt} sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
      <IconButton
        size="small"
        title="Remove image"
        onClick={onRemove}
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          bgcolor: 'rgba(0,0,0,0.55)',
          color: '#fff',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
