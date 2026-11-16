import { zodResolver } from '@hookform/resolvers/zod';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import FlagIcon from '@mui/icons-material/Flag';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  ButtonBase,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Controller, useFieldArray, useForm, type Control } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DatePickerField } from '../../components/DatePickerField';
import { FormPage } from '../../components/FormPage';
import { FormSection } from '../../components/FormSection';
import type { FormNavSection } from '../../components/FormSectionNav';
import { resolveStatusConfig } from '../../components/statusConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { TimePickerField } from '../../components/TimePickerField';
import { usePermission } from '../../hooks/usePermission';
import { useRouteId } from '../../hooks/useRouteId';
import * as customerService from '../../services/customerService';
import * as enquiryService from '../../services/enquiryService';
import * as eventTypeService from '../../services/eventTypeService';
import * as quotationService from '../../services/quotationService';
import * as userService from '../../services/userService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type {
  AppointmentStatus,
  CreateEnquiryInput,
  CustomerInput,
  EnquiryDetail,
  EnquiryStatus,
  UpdateEnquiryInput,
} from '../../types/enquiry';
import type { CustomerOption } from '../../types/masters';
import type {
  CreateQuotationInput,
  QuotationItemInput,
  QuotationListItem,
  QuotationRecipient,
  QuotationStatus,
} from '../../types/quotation';
import { formatCurrency, formatDate } from '../../utils/format';
import { fromId, toOptionalId } from '../../utils/ids';
import { enquiryFormSchema, type EnquiryFormValues } from '../../validation/enquirySchemas';
import { CustomerEditDialog } from './CustomerEditDialog';
import { EnquiryCustomerDetailsCard } from './EnquiryCustomerDetailsCard';
import { orderConfirmedWarning } from './enquiryOrderConfirmGuard';
import { EnquiryQuotationDialog } from './EnquiryQuotationDialog';
import { useEnquiryQuotations } from './useEnquiryQuotations';
import { ImageThumb } from '../quotations/ImageThumb';
import {
  setStagedCaption,
  stageQuotationImages,
  useStagedImageUrls,
  type StagedQuotationImage,
} from '../quotations/quotationImages';
import QuotationPreview from '../quotations/QuotationPreview';
import { QuotationPreviewDialog } from '../quotations/QuotationPreviewDialog';
import { QuotationItemsEditor } from '../quotations/QuotationItemsEditor';
import {
  EMPTY_QUOTATION_DRAFT_ITEM,
  quotationDraftTotals,
  toQuotationItemsInput,
  type QuotationDraftItem,
  type QuotationDraftTotals,
} from '../quotations/quotationDraft';

// Sharing-status phrasing for the enquiry-facing Quotation table's status select — statusConfig.ts's
// QUOTATION_STATUS_CONFIG already uses this same "has this been shared with, and accepted by, the
// customer" phrasing, so both modules read identically.
function quotationStatusLabel(status: QuotationStatus): string {
  return resolveStatusConfig('quotation', status).label;
}

const QUOTATION_STATUS_SELECT_OPTIONS: QuotationStatus[] = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED'];

// A REVISED quotation is a superseded old version — it never had its own further sharing/approval
// path, so it's treated the same as a fresh DRAFT ("Quotation Not Shared") here rather than ever
// surfacing the raw "Revised" term.
function quotationDisplayStatus(status: QuotationStatus): QuotationStatus {
  return status === 'REVISED' ? 'DRAFT' : status;
}

// All four statuses are always offered on every row (permission-gated), regardless of the row's
// current status — the backend still enforces which transitions actually make sense (DRAFT→SENT,
// SENT→APPROVED, SENT→REJECTED — see handleConfirmStatusChange), surfacing a clear error for any
// other pick rather than the UI restricting itself to the row's current status.
function quotationStatusOptions(status: QuotationStatus, canEdit: boolean, canApprove: boolean): QuotationStatus[] {
  const allowed = QUOTATION_STATUS_SELECT_OPTIONS.filter((option) => (option === 'APPROVED' ? canApprove : canEdit));
  return allowed.includes(status) ? allowed : [status, ...allowed];
}

// md files/forms.md "Enquiry Module": the Enquiry Status field, driving the documented
// Enquiry → ... → Closed workflow (docs/10_IMPLEMENTATION_DECISIONS.md §2).
//
// In both modes the status is an ordinary form field: picking one only records the choice on the
// form — no dialog, no request — and nothing leaves the page until Save. On create it rides along in
// the create payload; on edit the form's submit posts it to PATCH /enquiries/:id/status once the
// field edits are stored (see onSubmit), where the flow.md §3 Order Confirmed confirmation is also
// raised. Selecting a status no longer refetches the enquiry mid-edit, so unsaved figures such as
// Final Budget stay as typed.
type InitialEnquiryStatus = EnquiryStatus;

interface EnquiryStatusSectionProps {
  step: number;
  control: Control<EnquiryFormValues>;
  enquiry: EnquiryDetail | null;
  /** Called on every pick, so the page can retract an earlier Order Confirmed acknowledgement. */
  onStatusPicked: () => void;
}

// DOM ids of the form's sections — what the section navigator scrolls to.
const ENQUIRY_SECTION_IDS = {
  customer: 'enquiry-customer',
  event: 'enquiry-event',
  appointment: 'enquiry-appointment',
  quotation: 'enquiry-quotation',
  budget: 'enquiry-budget',
  status: 'enquiry-status',
} as const;

const APPOINTMENT_STATUS_OPTIONS: AppointmentStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const INITIAL_STATUS_OPTIONS: InitialEnquiryStatus[] = [
  'DRAFT',
  'PENDING',
  'APPOINTMENT_FIXED',
  'QUOTATION_TO_SHARE',
  'QUOTATION_SHARED',
  'ORDER_CONFIRMED',
  'ORDER_LOST',
];

// The status field sits near the bottom of the form, where MUI otherwise shifts the menu up over
// the trigger to keep it in the viewport — putting the first option (Draft) under the pointer, so a
// slightly slower click selects it on release. Anchoring the menu above the trigger keeps the
// options clear of the field.
const STATUS_MENU_PROPS = {
  anchorOrigin: { vertical: 'top', horizontal: 'left' },
  transformOrigin: { vertical: 'bottom', horizontal: 'left' },
} as const;

function EnquiryStatusSection({ step, control, enquiry, onStatusPicked }: EnquiryStatusSectionProps) {
  // masters/user.md §Enquiries — Change Status and Convert to Order are permissions of their own.
  // Confirming an enquiry is what creates the order, so that one option needs the second permission.
  const canChangeStatus = usePermission('ENQUIRIES', 'canChangeStatus');
  const canConvertToOrder = usePermission('ENQUIRIES', 'canConvertToOrder');

  // Sits above Status: the follow-up is the step that decides where the enquiry goes next, so it is
  // read before the status it feeds.
  const followUpField = (
    <Controller
      name="followUpDate"
      control={control}
      render={({ field }) => (
        <DatePickerField
          label="Follow-up Date"
          margin="none"
          value={field.value ? dayjs(field.value) : null}
          onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
        />
      )}
    />
  );

  const statusOptions = INITIAL_STATUS_OPTIONS.map((option) => (
    <MenuItem
      key={option}
      value={option}
      // Moving an enquiry to Order Confirmed converts it, so that option follows the Convert to
      // Order permission — at creation just as much as on an existing enquiry.
      disabled={option === 'ORDER_CONFIRMED' && !canConvertToOrder}
    >
      {resolveStatusConfig('enquiry', option).label}
    </MenuItem>
  ));

  if (!enquiry) {
    return (
      <FormSection
        id={ENQUIRY_SECTION_IDS.status}
        step={step}
        title="Enquiry Status"
        subtitle="Choose the status this enquiry should start at."
        icon={<FlagIcon />}
      >
        {followUpField}
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Status"
              fullWidth
              value={field.value}
              onChange={(event) => {
                field.onChange(event.target.value as InitialEnquiryStatus);
                onStatusPicked();
              }}
              sx={{ gridColumn: '1 / -1' }}
              slotProps={{ select: { MenuProps: STATUS_MENU_PROPS } }}
            >
              {statusOptions}
            </TextField>
          )}
        />
      </FormSection>
    );
  }

  return (
    <FormSection
      id={ENQUIRY_SECTION_IDS.status}
      step={step}
      title="Enquiry Status"
      subtitle="Update the enquiry's current status."
      icon={<FlagIcon />}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', gridColumn: '1 / -1' }}>
        <Typography variant="body2" color="text.secondary">
          Currently
        </Typography>
        <StatusBadge type="enquiry" status={enquiry.status} />
      </Stack>
      {followUpField}
      {/* Registered through Controller rather than driven by setValue()/watch(): as a bare
          controlled input the field was not part of the form's field registry, so a pick could be
          dropped and the select snap back to the stored status. */}
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <TextField
            select
            label="Status"
            fullWidth
            disabled={!canChangeStatus}
            value={field.value}
            onChange={(event) => {
              field.onChange(event.target.value as EnquiryStatus);
              onStatusPicked();
            }}
            // Only the reason the field is locked is spelled out; the rest speaks for itself.
            helperText={!canChangeStatus ? 'You do not have permission to change this enquiry’s status.' : undefined}
            sx={{ gridColumn: '1 / -1' }}
            slotProps={{ select: { MenuProps: STATUS_MENU_PROPS } }}
          >
            {statusOptions}
          </TextField>
        )}
      />
    </FormSection>
  );
}

interface QuotationDraftControls {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  /** Discards the draft entirely — clears the items and taxes and unticks the checkbox. */
  onCancel: () => void;
  items: QuotationDraftItem[];
  onItemsChange: (items: QuotationDraftItem[]) => void;
  cgstPercent: string;
  sgstPercent: string;
  onCgstChange: (value: string) => void;
  onSgstChange: (value: string) => void;
  totals: QuotationDraftTotals;
  error: string | null;
  /** Shares the enquiry form's Advance Amount, so the Final Budget and Quotation fields stay in step. */
  advanceAmount: string;
  onAdvanceChange: (value: string) => void;
  /** Object URLs of the staged (not-yet-uploaded) sample decor images. */
  imageUrls: string[];
  /** The description typed for each staged image, in the same order as `imageUrls`. */
  imageCaptions: string[];
  onImagesAdd: (files: File[]) => void;
  onImageCaptionChange: (index: number, caption: string) => void;
  onImageRemove: (index: number) => void;
}

// md files/enquiry.md "Quotation Section": a Quotation section is available from the enquiry so a
// quotation can be created without re-entering customer/event details. Mirrors the Enquiry Detail
// page's section — in edit mode it lists the linked quotations with a permission-/status-gated
// "Create Quotation" action. Before the enquiry is saved there is no enquiryId to link a quotation
// to yet, so instead of navigating away, this lets the items be entered inline — Save Enquiry then
// creates both records together (the enquiry first, then the quotation against its new id), and the
// backend already moves the enquiry to "Quotation to Share" the moment a quotation exists for it.
function QuotationSection({
  step,
  enquiry,
  draft,
}: {
  step: number;
  enquiry: EnquiryDetail | null;
  draft?: QuotationDraftControls;
}) {
  // Defaulted here rather than trusting the prop: a hot-reloaded parent can briefly still hold the
  // previous draft object (without staged images), which otherwise crashed the whole page.
  const draftImageUrls = draft?.imageUrls ?? [];
  const draftImageCaptions = draft?.imageCaptions ?? [];
  const queryClient = useQueryClient();
  const canCreateQuotation = usePermission('QUOTATIONS', 'canCreate');
  const canEdit = usePermission('QUOTATIONS', 'canEdit');
  const canApprove = usePermission('QUOTATIONS', 'canApprove');
  const [previewQuotationId, setPreviewQuotationId] = useState<number | null>(null);
  // "md files/Enquiry/flow.md" §2.3: Create Quotation opens a modal rather than navigating away —
  // and so does Edit, on the row's own quotation, so neither action leaves the enquiry.
  // `null` = closed, 0 = composing a new quotation, any other id = editing that one.
  const [quotationDialogFor, setQuotationDialogFor] = useState<number | null>(null);

  const { data: quotations } = useEnquiryQuotations(enquiry?.id);

  // Editable Status column: every row's dropdown always offers all four of Not Shared/Shared/
  // Confirmed/Rejected (quotationStatusOptions), regardless of the row's current status. The
  // backend only actually supports DRAFT→SENT (changeStatus), SENT→APPROVED (approve — one
  // approved quotation per enquiry, docs/10_IMPLEMENTATION_DECISIONS.md), and SENT→REJECTED
  // (changeStatus); any other pick (e.g. reverting an already-shared quotation back to Not Shared)
  // has no such endpoint, so it's caught client-side with a clear message instead of silently
  // doing nothing.
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: number;
    quotationNumber: string;
    target: QuotationStatus;
  } | null>(null);
  const [statusChangeError, setStatusChangeError] = useState<string | null>(null);

  function invalidateQuotationQueries() {
    queryClient.invalidateQueries({ queryKey: ['quotations', { enquiryId: enquiry?.id }] });
  }

  function invalidateEnquiryQueries() {
    queryClient.invalidateQueries({ queryKey: ['enquiry', enquiry?.id] });
    queryClient.invalidateQueries({ queryKey: ['enquiries'] });
  }

  const sendMutation = useMutation({
    mutationFn: (id: number) => quotationService.changeStatus(id, 'SENT'),
    onSuccess: invalidateQuotationQueries,
  });
  const approveMutation = useMutation({
    mutationFn: (id: number) => quotationService.approve(id),
    onSuccess: () => {
      invalidateQuotationQueries();
      invalidateEnquiryQueries();
    },
  });
  const rejectMutation = useMutation({
    mutationFn: (id: number) => quotationService.changeStatus(id, 'REJECTED'),
    onSuccess: () => {
      invalidateQuotationQueries();
      invalidateEnquiryQueries();
    },
  });

  const statusChangePending = sendMutation.isPending || approveMutation.isPending || rejectMutation.isPending;

  function closeStatusChangeConfirm() {
    setPendingStatusChange(null);
    setStatusChangeError(null);
  }

  async function handleConfirmStatusChange() {
    if (!pendingStatusChange) return;
    setStatusChangeError(null);
    try {
      if (pendingStatusChange.target === 'APPROVED') {
        await approveMutation.mutateAsync(pendingStatusChange.id);
      } else if (pendingStatusChange.target === 'SENT') {
        await sendMutation.mutateAsync(pendingStatusChange.id);
      } else if (pendingStatusChange.target === 'REJECTED') {
        await rejectMutation.mutateAsync(pendingStatusChange.id);
      } else {
        setStatusChangeError(`Cannot change a quotation back to ${quotationStatusLabel(pendingStatusChange.target)}.`);
        return;
      }
      setPendingStatusChange(null);
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        setStatusChangeError(err.response.data.message);
      } else {
        setStatusChangeError('Unable to update the quotation status.');
      }
    }
  }

  if (!enquiry) {
    if (!canCreateQuotation || !draft) return null;

    return (
      <FormSection
        id={ENQUIRY_SECTION_IDS.quotation}
        step={step}
        title="Quotation"
        subtitle="Optionally add items now — saving the enquiry will create this quotation with it."
        icon={<RequestQuoteIcon />}
      >
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormControlLabel
            control={<Checkbox checked={draft.enabled} onChange={(event) => draft.onToggle(event.target.checked)} />}
            label="Create a quotation for this enquiry now"
          />

          {draft.enabled && (
            <Box sx={{ mt: 2 }}>
              <QuotationItemsEditor
                items={draft.items}
                onItemsChange={draft.onItemsChange}
                cgstPercent={draft.cgstPercent}
                sgstPercent={draft.sgstPercent}
                onCgstChange={draft.onCgstChange}
                onSgstChange={draft.onSgstChange}
                totals={draft.totals}
                error={draft.error}
                advanceAmount={draft.advanceAmount}
                onAdvanceChange={draft.onAdvanceChange}
              />

              <Box sx={{ mt: 2 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateIcon />}>
                    Add Sample Decor Images
                    <input
                      hidden
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        event.target.value = '';
                        if (files.length) draft.onImagesAdd?.(files);
                      }}
                    />
                  </Button>
                </Stack>
                {draftImageUrls.length > 0 && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      gap: 1.5,
                      mt: 2,
                    }}
                  >
                    {draftImageUrls.map((url, index) => (
                      <ImageThumb
                        key={url}
                        src={url}
                        alt={`decor ${index + 1}`}
                        caption={draftImageCaptions[index] ?? ''}
                        onCaptionChange={(value) => draft.onImageCaptionChange?.(index, value)}
                        onRemove={() => draft.onImageRemove?.(index)}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              {/* The counterpart of the dialog's Cancel: discards the draft and leaves the enquiry
                  itself untouched, so the form's own Save/Cancel still mean what they did before. */}
              <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 1.5 }}>
                <Button size="small" variant="outlined" startIcon={<CloseIcon />} onClick={draft.onCancel}>
                  Cancel Quotation
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      </FormSection>
    );
  }

  const showCreateQuotation = canCreateQuotation;

  const quotationColumns: DataTableColumn<QuotationListItem>[] = [
    { key: 'quotationNumber', header: 'Quotation No' },
    { key: 'version', header: 'Version', render: (row) => `v${row.version}` },
    { key: 'quotationDate', header: 'Date', render: (row) => formatDate(row.quotationDate) },
    { key: 'totalAmount', header: 'Total', align: 'right', render: (row) => formatCurrency(row.totalAmount) },
    {
      key: 'status',
      header: 'Status',
      // Every row is editable — options are always Not Shared/Shared/Confirmed/Rejected
      // (quotationStatusOptions), regardless of the row's current status. Disabled only when the
      // user has neither permission to change anything at all.
      render: (row) => {
        const displayStatus = quotationDisplayStatus(row.status);
        const options = quotationStatusOptions(displayStatus, canEdit, canApprove);
        return (
          <Box onClick={(event) => event.stopPropagation()} sx={{ display: 'inline-flex' }}>
            <TextField
              select
              size="small"
              value={displayStatus}
              disabled={!canEdit && !canApprove}
              onChange={(event) => {
                const target = event.target.value as QuotationStatus;
                if (target === displayStatus) return;
                setPendingStatusChange({ id: row.id, quotationNumber: row.quotationNumber, target });
              }}
              sx={{ minWidth: { xs: 150, sm: 200 } }}
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {quotationStatusLabel(option)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setPreviewQuotationId(row.id);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* No status gate — enq.md §6/§7: a quotation stays editable at every stage. */}
          {canEdit && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  setQuotationDialogFor(row.id);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <FormSection
      id={ENQUIRY_SECTION_IDS.quotation}
      step={step}
      title="Quotation"
      subtitle="Quotations linked to this enquiry."
      icon={<RequestQuoteIcon />}
    >
      <Box sx={{ gridColumn: '1 / -1' }}>
        {showCreateQuotation && (
          <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 1.5 }}>
            {/* Contained, matching the Enquiry Detail page's identical action: MUI's default text
                variant left this reading as a caption rather than an available option. */}
            <Button
              size="small"
              variant="contained"
              startIcon={<RequestQuoteIcon />}
              onClick={() => setQuotationDialogFor(0)}
            >
              Create Quotation
            </Button>
          </Stack>
        )}
        <DataTable
          disableContainer
          columns={quotationColumns}
          rows={quotations?.records ?? []}
          getRowId={(row) => row.id}
          page={1}
          limit={50}
          onPageChange={() => undefined}
          onLimitChange={() => undefined}
          onRowClick={(row) => setPreviewQuotationId(row.id)}
          emptyState={{
            icon: <RequestQuoteIcon sx={{ fontSize: 36 }} />,
            title: 'No quotations yet',
            description: 'No quotation has been created for this enquiry.',
          }}
        />

        <ConfirmDialog
          open={pendingStatusChange !== null}
          title={
            pendingStatusChange?.target === 'APPROVED'
              ? 'Confirm Quotation?'
              : pendingStatusChange?.target === 'SENT'
                ? 'Mark Quotation as Shared?'
                : 'Change Quotation Status?'
          }
          message={
            <Stack spacing={1.5}>
              {statusChangeError && <Alert severity="error">{statusChangeError}</Alert>}
              {!statusChangeError && pendingStatusChange && (
                <Typography variant="body2">
                  {pendingStatusChange.target === 'APPROVED' &&
                    `Confirm quotation "${pendingStatusChange.quotationNumber}"? The enquiry keeps its current status — move it to Order Confirmed yourself when the order should be raised. The enquiry's final budget becomes the total of everything confirmed.`}
                  {pendingStatusChange.target === 'SENT' &&
                    `Mark quotation "${pendingStatusChange.quotationNumber}" as shared with the customer?`}
                  {pendingStatusChange.target === 'DRAFT' &&
                    `Mark quotation "${pendingStatusChange.quotationNumber}" as not shared?`}
                </Typography>
              )}
            </Stack>
          }
          confirmLabel={
            pendingStatusChange?.target === 'APPROVED'
              ? 'Finalize'
              : pendingStatusChange?.target === 'SENT'
                ? 'Send'
                : 'Confirm'
          }
          loading={statusChangePending}
          onConfirm={handleConfirmStatusChange}
          onClose={closeStatusChangeConfirm}
        />

        <QuotationPreviewDialog quotationId={previewQuotationId} onClose={() => setPreviewQuotationId(null)} />

        {/* flow.md §2.3: raised in place — saving keeps the user on the enquiry, with the table
            below refreshed from the dialog's own invalidation. */}
        <EnquiryQuotationDialog
          open={quotationDialogFor !== null}
          quotationId={quotationDialogFor || null}
          enquiry={{
            id: enquiry.id,
            enquiryNumber: enquiry.enquiryNumber,
            customerName: enquiry.customer.customerName,
            mobile: enquiry.customer.mobile,
            whatsapp: enquiry.prospect?.whatsapp ?? enquiry.customer.mobile,
            email: enquiry.prospect?.email ?? null,
            address: enquiry.prospect?.address ?? null,
            eventDate: enquiry.eventDate,
            advanceAmount: enquiry.advanceAmount,
          }}
          onClose={() => setQuotationDialogFor(null)}
          onSaved={() => setQuotationDialogFor(null)}
        />
      </Box>
    </FormSection>
  );
}

interface CustomerTypeCardProps {
  icon: ReactNode;
  title: string;
  selected: boolean;
  onSelect: () => void;
}

// enquiry.md §Step 1 offers two ways to start an enquiry (New Customer / Existing Customer). It's
// the first decision on the form and changes which fields follow, so it's a pair of explanatory
// cards rather than a pair of small toggle buttons.
function CustomerTypeCard({ icon, title, selected, onSelect }: CustomerTypeCardProps) {
  return (
    <ButtonBase
      onClick={onSelect}
      aria-pressed={selected}
      sx={(theme) => ({
        // The parent stacks in a column on phones, where a flex-basis is a height, not a width.
        flex: { xs: '0 0 auto', sm: '1 1 200px' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1,
        p: 1.25,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        backgroundColor: selected
          ? `color-mix(in srgb, ${(theme.vars ?? theme).palette.primary.main} 8%, transparent)`
          : 'transparent',
        textAlign: 'left',
        transition: 'border-color 200ms ease, background-color 200ms ease, transform 200ms ease',
        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)' },
      })}
    >
      <Box sx={{ display: 'flex', color: selected ? 'primary.main' : 'text.secondary', '& svg': { fontSize: 20 } }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>
          {title}
        </Typography>
      </Box>
      {selected && <CheckCircleIcon color="primary" fontSize="small" sx={{ ml: 'auto', flexShrink: 0 }} />}
    </ButtonBase>
  );
}

function cleanOptional(value: string | undefined): string | undefined {
  return value && value.trim() !== '' ? value : undefined;
}

function toCreateInput(values: EnquiryFormValues): CreateEnquiryInput {
  // toOptionalId/cleanOptional rather than the required toId(): a DRAFT enquiry can reach here with
  // any of these left blank (validation.ts on both ends skips the usual required-field checks for
  // status DRAFT), and a blank field must be omitted, not sent as an invalid 0 or empty string.
  const customer: CustomerInput =
    values.customerType === 'EXISTING'
      ? { type: 'EXISTING', customerId: toOptionalId(values.customerId) }
      : {
          type: 'NEW',
          customerName: cleanOptional(values.customerName),
          mobile: cleanOptional(values.mobile),
          whatsapp: cleanOptional(values.whatsapp),
          email: cleanOptional(values.email),
          address: cleanOptional(values.address),
          city: cleanOptional(values.city),
        };

  return {
    customer,
    eventTypeId: toOptionalId(values.eventTypeId),
    eventName: cleanOptional(values.eventName),
    // Rows with no date are dropped (a draft may leave them blank); the server makes the earliest
    // day the enquiry's main date.
    eventDays: values.eventDays
      .filter((day) => day.eventDate)
      .map((day) => ({ eventDate: day.eventDate, eventTime: day.eventTime || null })),
    mahal: cleanOptional(values.mahal),
    venue: cleanOptional(values.venue),
    estimatedBudget: values.estimatedBudget ? Number(values.estimatedBudget) : undefined,
    // Sent on create as well as update: an enquiry logged straight into Order Confirmed converts
    // immediately, and these are the figures its order's budget and opening advance come from.
    finalBudgetAmount: values.finalBudgetAmount ? Number(values.finalBudgetAmount) : undefined,
    advanceAmount: values.advanceAmount ? Number(values.advanceAmount) : undefined,
    notes: cleanOptional(values.notes),
    appointmentDate: cleanOptional(values.appointmentDate),
    appointmentTime: cleanOptional(values.appointmentTime),
    meetingLocation: cleanOptional(values.meetingLocation),
    appointmentNotes: cleanOptional(values.appointmentNotes),
    appointmentStatus: values.appointmentStatus,
    assignedUserId: toOptionalId(values.assignedUserId),
    eventManagerId: toOptionalId(values.eventManagerId),
    followUpDate: cleanOptional(values.followUpDate),
    status: values.status,
  };
}

function toUpdateInput(values: EnquiryFormValues): UpdateEnquiryInput {
  // finalBudgetAmount/advanceAmount ride along in `rest` — toCreateInput carries them now that they
  // are settable at creation too.
  const { customer: _customer, status: _status, ...rest } = toCreateInput(values);
  // Explicit null rather than the omission cleanOptional() produces: clearing the field is how a
  // user records that the follow-up is no longer owed, and an omitted field would leave the stored
  // date in place.
  const followUpDate = values.followUpDate?.trim() ? values.followUpDate : null;
  // Likewise explicit null for the event manager, so choosing "Not set" removes a stored one.
  const eventManagerId = toOptionalId(values.eventManagerId) ?? null;
  // A still-unconfirmed enquiry (customerType NEW) keeps its customer details on the enquiry itself,
  // so edits to them are sent as prospect fields. A linked (EXISTING) enquiry's customer is locked.
  if (values.customerType === 'NEW') {
    return {
      ...rest,
      followUpDate,
      eventManagerId,
      customerName: values.customerName ?? '',
      mobile: values.mobile ?? '',
      whatsapp: cleanOptional(values.whatsapp),
      email: cleanOptional(values.email),
      address: cleanOptional(values.address),
      city: cleanOptional(values.city),
    };
  }
  return { ...rest, followUpDate, eventManagerId };
}

const EMPTY_VALUES: EnquiryFormValues = {
  customerType: 'NEW',
  customerId: '',
  customerName: '',
  mobile: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  eventTypeId: '',
  eventName: '',
  eventDays: [{ eventDate: '', eventTime: '' }],
  mahal: '',
  venue: '',
  estimatedBudget: '',
  finalBudgetAmount: '',
  advanceAmount: '',
  notes: '',
  appointmentDate: '',
  followUpDate: '',
  appointmentTime: '',
  meetingLocation: '',
  appointmentNotes: '',
  appointmentStatus: 'PENDING',
  assignedUserId: '',
  eventManagerId: '',
  status: 'PENDING',
};

export default function EnquiryFormPage() {
  const id = useRouteId();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canViewCustomers = usePermission('CUSTOMERS', 'canView');
  const canEditCustomers = usePermission('CUSTOMERS', 'canEdit');
  const canAssign = usePermission('ENQUIRIES', 'canAssign');

  // A caller that sent the user here to correct enquiry details — currently the quotation view
  // page's "Edit Enquiry" button — passes where to return to, so Save/Cancel land back on the
  // record being worked on instead of dumping the user on the Enquiries list.
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? null;

  function leaveForm(fallbackState?: { highlightId: number }) {
    if (returnTo) navigate(returnTo);
    else navigate('/enquiries', fallbackState ? { state: fallbackState } : undefined);
  }

  const [serverError, setServerError] = useState<string | null>(null);
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  // On by default: a WhatsApp number is the phone number far more often than not, so it autofills
  // as the phone number is typed. Editing the WhatsApp field turns this off and hands it over. In
  // edit mode the effect that loads an existing enquiry recomputes it from what was saved.
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(false);

  // Inline "create a quotation together with this enquiry" draft — create mode only. Kept as plain
  // state rather than part of the enquiry form/schema since it submits as a separate request only
  // after the enquiry itself is saved.
  const [addQuotationNow, setAddQuotationNow] = useState(false);
  const [quotationItems, setQuotationItems] = useState<QuotationDraftItem[]>([{ ...EMPTY_QUOTATION_DRAFT_ITEM }]);
  const [quotationCgst, setQuotationCgst] = useState('');
  const [quotationSgst, setQuotationSgst] = useState('');
  const [quotationItemsError, setQuotationItemsError] = useState<string | null>(null);
  const [quotationImages, setQuotationImages] = useState<StagedQuotationImage[]>([]);
  // Object URLs for previewing staged (not-yet-uploaded) images — uploaded once the linked
  // quotation exists, since images hang off a quotation id.
  const quotationImageUrls = useStagedImageUrls(quotationImages);
  const [quotationPreviewOpen, setQuotationPreviewOpen] = useState(true);

  // "md files/Enquiry/flow.md" §3 — create mode's Order Confirmed confirmation. The message is
  // held in state to show the popup; the acknowledgement is a ref because onSubmit re-runs from
  // the popup's own handler and has to see the answer within the same tick.
  const [pendingOrderConfirmWarning, setPendingOrderConfirmWarning] = useState<string | null>(null);
  const orderConfirmAcknowledged = useRef(false);

  const { data: existingEnquiry } = useQuery({
    queryKey: ['enquiry', id],
    queryFn: () => enquiryService.getById(id),
    enabled: isEdit,
  });

  // "md files/Enquiry/flow.md" §3 — the quotation statuses behind the Order Confirmed confirmation
  // raised at save time. Shares its cache key with the Quotation section below, so no extra request.
  const { data: enquiryQuotations } = useEnquiryQuotations(isEdit ? id : undefined);

  const { data: eventTypes } = useQuery({
    queryKey: ['event-types', 'active'],
    queryFn: () => eventTypeService.listActive(),
  });

  const { data: users } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => userService.listActive(),
  });

  // Company letterhead + bank details for the inline quotation preview — only fetched once the
  // "create a quotation now" draft is actually in use.
  const { data: quotationBranding } = useQuery({
    queryKey: ['quotation-branding'],
    queryFn: () => quotationService.getBranding(),
    staleTime: 5 * 60 * 1000,
    enabled: !isEdit && addQuotationNow,
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Seeded once per enquiry, not on every arrival of ['enquiry', id]: the record is refetched while
  // the form is open (a quotation's status change invalidates it, as does a bfcache restore), and
  // re-running reset() on that would throw away everything typed but not yet saved — the status pick
  // and the Final Budget among them.
  const seededEnquiryId = useRef<number | null>(null);
  // The stored Final Budget the field currently reflects — see the re-sync effect below.
  const syncedFinalBudget = useRef<string | null>(null);
  // The stored Advance the field currently reflects. Saving an enquiry-sourced quotation syncs the
  // quotation's advance back onto the enquiry, so the Final Budget field has to follow that write.
  const syncedAdvanceAmount = useRef<string | null>(null);

  useEffect(() => {
    if (!existingEnquiry) return;
    if (seededEnquiryId.current === existingEnquiry.id) return;
    seededEnquiryId.current = existingEnquiry.id;
    syncedFinalBudget.current = existingEnquiry.finalBudgetAmount ?? '';
    syncedAdvanceAmount.current = existingEnquiry.advanceAmount ?? '';
    // A prospect enquiry (no Customer row yet) is edited like a NEW customer — its details live in
    // the `prospect` block and stay editable. A linked enquiry's customer is fixed (EXISTING).
    const isProspect = existingEnquiry.customer.id === null;
    reset({
      ...EMPTY_VALUES,
      customerType: isProspect ? 'NEW' : 'EXISTING',
      customerId: fromId(existingEnquiry.customer.id),
      customerName: existingEnquiry.prospect?.customerName ?? '',
      mobile: existingEnquiry.prospect?.mobile ?? '',
      whatsapp: existingEnquiry.prospect?.whatsapp ?? '',
      email: existingEnquiry.prospect?.email ?? '',
      address: existingEnquiry.prospect?.address ?? '',
      city: existingEnquiry.prospect?.city ?? '',
      eventTypeId: fromId(existingEnquiry.eventType?.id),
      eventName: existingEnquiry.eventName ?? '',
      eventDays: existingEnquiry.eventDays.length
        ? existingEnquiry.eventDays.map((day) => ({ eventDate: day.eventDate, eventTime: day.eventTime ?? '' }))
        : [{ eventDate: existingEnquiry.eventDate?.slice(0, 10) ?? '', eventTime: existingEnquiry.eventTime ?? '' }],
      mahal: existingEnquiry.mahal ?? '',
      venue: existingEnquiry.venue ?? '',
      estimatedBudget: existingEnquiry.estimatedBudget ?? '',
      finalBudgetAmount: existingEnquiry.finalBudgetAmount ?? '',
      advanceAmount: existingEnquiry.advanceAmount ?? '',
      notes: existingEnquiry.notes ?? '',
      appointmentDate: existingEnquiry.appointmentDate ?? '',
      appointmentTime: existingEnquiry.appointmentTime ?? '',
      meetingLocation: existingEnquiry.meetingLocation ?? '',
      appointmentNotes: existingEnquiry.appointmentNotes ?? '',
      appointmentStatus: existingEnquiry.appointmentStatus,
      assignedUserId: fromId(existingEnquiry.assignedUser?.id),
      eventManagerId: fromId(existingEnquiry.eventManager?.id),
      followUpDate: existingEnquiry.followUpDate ?? '',
      status: existingEnquiry.status,
    });
    if (!isProspect) {
      setSelectedCustomer({
        id: existingEnquiry.customer.id as number,
        customerCode: '',
        customerName: existingEnquiry.customer.customerName,
        mobile: existingEnquiry.customer.mobile,
      });
    }
    setSameAsMobile(
      Boolean(existingEnquiry.prospect?.mobile) && existingEnquiry.prospect?.mobile === existingEnquiry.prospect?.whatsapp,
    );
  }, [existingEnquiry, reset]);

  // The one field the server recomputes while this page is open: confirming a quotation sets the
  // enquiry's Final Budget to the combined total of every confirmed quotation
  // (quotations/service.ts approve). The seeding above deliberately runs only once, so that new
  // figure is carried across here instead — unless the user has typed their own, which is an
  // override the enquiry keeps (enquiries/service.ts update) and must not be overwritten.
  useEffect(() => {
    if (!existingEnquiry || seededEnquiryId.current !== existingEnquiry.id) return;
    const stored = existingEnquiry.finalBudgetAmount ?? '';
    if (syncedFinalBudget.current === stored) return;
    syncedFinalBudget.current = stored;
    if (dirtyFields.finalBudgetAmount) return;
    setValue('finalBudgetAmount', stored);
  }, [existingEnquiry, dirtyFields.finalBudgetAmount, setValue]);

  // Same idea for the advance: a quotation saved from the dialog syncs its advance onto the
  // enquiry server-side, so mirror that write here rather than leaving the Final Budget field stale.
  useEffect(() => {
    if (!existingEnquiry || seededEnquiryId.current !== existingEnquiry.id) return;
    const stored = existingEnquiry.advanceAmount ?? '';
    if (syncedAdvanceAmount.current === stored) return;
    syncedAdvanceAmount.current = stored;
    setValue('advanceAmount', stored);
  }, [existingEnquiry, setValue]);

  const customerType = watch('customerType');
  const mobileValue = watch('mobile');
  const whatsappValue = watch('whatsapp');
  // Registered up here because both fields wrap their own onChange around the one react-hook-form
  // hands back, and calling register() inline would rebuild that handler on every render.
  const mobileField = register('mobile');
  const whatsappField = register('whatsapp');
  const customerNameValue = watch('customerName');
  const emailValue = watch('email');
  const addressValue = watch('address');
  // The earliest day is the enquiry's main date — the quotation preview is dated by it.
  const eventDateValue =
    watch('eventDays')
      .map((day) => day.eventDate)
      .filter(Boolean)
      .sort()[0] ?? '';
  const {
    fields: eventDayFields,
    append: appendEventDay,
    remove: removeEventDay,
  } = useFieldArray({ control, name: 'eventDays' });
  const advanceAmountValue = watch('advanceAmount');

  // Runs with an empty term as soon as the "Existing Customer" picker is shown so the dropdown
  // already lists the customer master; typing narrows it down server-side. Previous results are
  // kept as placeholder data so the list doesn't blank out between keystrokes.
  const { data: customerOptions, isFetching: isFetchingCustomers } = useQuery({
    queryKey: ['customers', 'search', customerSearchInput.trim()],
    queryFn: () => customerService.search(customerSearchInput),
    enabled: !isEdit && customerType === 'EXISTING',
    placeholderData: (previous) => previous,
  });

  // The picker (create) and the enquiry payload (edit) only carry name/mobile, so the linked
  // customer's master record is read to fill the read-only details card — and, in create mode, the
  // quotation preview's "To:" block. Gated on the same permission the API enforces
  // (server/src/modules/customers/routes.ts).
  const linkedCustomerId = isEdit ? (existingEnquiry?.customer.id ?? null) : (selectedCustomer?.id ?? null);
  const { data: linkedCustomer, isLoading: isLoadingLinkedCustomer } = useQuery({
    queryKey: ['customer', linkedCustomerId],
    queryFn: () => customerService.getById(linkedCustomerId!),
    enabled: Boolean(linkedCustomerId) && customerType === 'EXISTING' && canViewCustomers,
  });

  // Keeps WhatsApp mirrored to the phone number live while the checkbox is on, so editing the
  // phone number doesn't silently leave a stale WhatsApp value behind. Guarded by an equality
  // check so this doesn't fire (and falsely mark the form dirty) right after an existing
  // enquiry loads with the two fields already equal.
  useEffect(() => {
    if (sameAsMobile && whatsappValue !== mobileValue) {
      setValue('whatsapp', mobileValue, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameAsMobile, mobileValue]);
  // A linked (EXISTING) customer is locked in edit mode. An unconfirmed prospect (customerType NEW)
  // stays editable so its details can still be corrected before the enquiry is confirmed.
  const customerLocked = isEdit && customerType === 'EXISTING';

  // Only invalidates the cache here — where to navigate and what to toast depends on whether a
  // quotation is being created alongside it, which onSubmit decides.
  const createMutation = useMutation({
    mutationFn: (input: CreateEnquiryInput) => enquiryService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enquiries'] }),
  });

  // The cache refresh and the navigation happen in onSubmit instead: a status change chosen on the
  // form is a second request that has to complete first, and refetching the enquiry between the two
  // would reset the still-unsaved fields (Final Budget among them) from the server.
  const updateMutation = useMutation({
    mutationFn: (input: UpdateEnquiryInput) => enquiryService.update(id, input),
  });

  // The status picked in the Enquiry Status section, applied on save through the dedicated endpoint
  // (PATCH /enquiries/:id/status) that PUT /enquiries/:id deliberately does not cover. Posted after
  // the field edits are stored, so an enquiry confirmed in the same save converts using the budget
  // figures just entered.
  const statusMutation = useMutation({
    mutationFn: (status: EnquiryStatus) => enquiryService.changeStatus(id, status),
  });

  // The backend already moves an enquiry to QUOTATION_TO_SHARE the instant a quotation exists for
  // it (quotations/service.ts create()), so creating this quotation IS the "auto-update" — no
  // separate status call is needed here.
  const createQuotationMutation = useMutation({
    mutationFn: (input: CreateQuotationInput) => quotationService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotations'] }),
  });

  const saving =
    createMutation.isPending || updateMutation.isPending || statusMutation.isPending || createQuotationMutation.isPending;

  const quotationTotals = quotationDraftTotals(quotationItems, quotationCgst, quotationSgst);

  // Backs out of the inline quotation draft: the enquiry is still saved on its own, just without a
  // quotation attached. Ticking the checkbox again starts from an empty table rather than resuming
  // the abandoned one.
  function cancelQuotationDraft() {
    setAddQuotationNow(false);
    setQuotationItems([{ ...EMPTY_QUOTATION_DRAFT_ITEM }]);
    setQuotationCgst('');
    setQuotationSgst('');
    setQuotationItemsError(null);
    setQuotationImages([]);
  }

  // Capped at the same 12-image limit the server enforces on quotation image uploads.
  function addQuotationImages(files: File[]) {
    setQuotationImages((prev) => stageQuotationImages(prev, files));
  }

  function setQuotationImageCaption(index: number, caption: string) {
    setQuotationImages((prev) => setStagedCaption(prev, index, caption));
  }

  function removeQuotationImage(index: number) {
    setQuotationImages((prev) => prev.filter((_, i) => i !== index));
  }

  // Mirrors whichever customer source is currently selected, so the preview's "To:" line matches
  // what will actually be sent to quotationService.create() once the enquiry is saved.
  const quotationPreviewRecipient: QuotationRecipient =
    customerType === 'EXISTING'
      ? {
          // The picker gives name/mobile immediately; the customer record read for the details card
          // enriches this with WhatsApp, email and address once it arrives.
          name: linkedCustomer?.customerName ?? selectedCustomer?.customerName ?? null,
          phone: linkedCustomer?.mobile ?? selectedCustomer?.mobile ?? null,
          whatsapp: linkedCustomer?.whatsapp ?? selectedCustomer?.mobile ?? null,
          email: linkedCustomer?.email ?? null,
          address: linkedCustomer?.address ?? null,
          gst: null,
        }
      : {
          name: customerNameValue || null,
          phone: mobileValue || null,
          whatsapp: whatsappValue || mobileValue || null,
          email: emailValue || null,
          address: addressValue || null,
          gst: null,
        };

  const quotationPreviewPanel = (
    <>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5, flexShrink: 0 }}>
        Live Preview
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
        <QuotationPreview
          company={quotationBranding}
          recipient={quotationPreviewRecipient}
          quotationNumber="Auto-generated"
          quotationDate={eventDateValue ? formatDate(eventDateValue) : ''}
          items={quotationItems
            .filter((item) => item.itemName.trim() !== '')
            .map((item) => ({
              itemName: item.itemName,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.rate) || 0,
              amount: (Number(item.quantity) || 0) * (Number(item.rate) || 0),
            }))}
          subtotal={quotationTotals.subtotal}
          cgstPercent={quotationTotals.cgstPercent}
          sgstPercent={quotationTotals.sgstPercent}
          cgstAmount={quotationTotals.cgstAmount}
          sgstAmount={quotationTotals.sgstAmount}
          total={quotationTotals.total}
          advanceAmount={Number(advanceAmountValue) || 0}
          images={quotationImageUrls.map((url, index) => ({ src: url, caption: quotationImages[index]?.caption || null }))}
        />
      </Box>
    </>
  );

  const quotationPreviewToggleButton = (
    <Button
      variant="outlined"
      size="small"
      startIcon={quotationPreviewOpen ? <VisibilityOffIcon /> : <VisibilityIcon />}
      onClick={() => setQuotationPreviewOpen((prev) => !prev)}
    >
      {quotationPreviewOpen ? 'Hide Preview' : 'Show Preview'}
    </Button>
  );

  const showQuotationPreview = !isEdit && addQuotationNow;

  // The section navigator. The Quotation card exists for an existing enquiry, and for a new one only
  // when the user may create quotations (QuotationSection returns nothing otherwise) — so the list,
  // and the step numbers on the cards, skip it in that case.
  const canCreateQuotationHere = usePermission('QUOTATIONS', 'canCreate');
  const hasQuotationSection = isEdit || canCreateQuotationHere;
  const sectionHasError = (fields: string[]) => fields.some((field) => field in errors);
  const sectionNav: FormNavSection[] = [
    {
      id: ENQUIRY_SECTION_IDS.customer,
      label: 'Customer',
      hasError: sectionHasError(['customerId', 'customerName', 'mobile', 'whatsapp', 'email', 'address', 'city']),
    },
    {
      id: ENQUIRY_SECTION_IDS.event,
      label: 'Event',
      hasError: sectionHasError(['eventTypeId', 'eventDays', 'mahal', 'venue', 'estimatedBudget', 'eventManagerId']),
    },
    { id: ENQUIRY_SECTION_IDS.appointment, label: 'Appointment', hasError: sectionHasError(['appointmentDate']) },
    ...(hasQuotationSection ? [{ id: ENQUIRY_SECTION_IDS.quotation, label: 'Quotation' }] : []),
    {
      id: ENQUIRY_SECTION_IDS.budget,
      label: 'Final Budget',
      hasError: sectionHasError(['finalBudgetAmount', 'advanceAmount']),
    },
    { id: ENQUIRY_SECTION_IDS.status, label: 'Status', hasError: sectionHasError(['status', 'followUpDate']) },
  ];

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setQuotationItemsError(null);

    // Validated up front — before the enquiry is created — so a mistake here is caught while
    // it's still cheap to fix, rather than after the enquiry is already saved.
    let quotationItemsInput: QuotationItemInput[] | null = null;
    if (!isEdit && addQuotationNow) {
      const parsed = toQuotationItemsInput(
        quotationItems,
        'Add at least one item, or turn off "Create a quotation for this enquiry now".',
      );
      if (parsed.items === null) {
        setQuotationItemsError(parsed.error);
        return;
      }
      quotationItemsInput = parsed.items;
    }

    // "md files/Enquiry/flow.md" §3 — the one confirmation the status still gets, raised here at
    // save time rather than when the field is picked. Only when the enquiry is actually *moving*
    // into Order Confirmed: re-saving an already-confirmed enquiry has nothing to confirm. On
    // create there is no quotation yet; the inline draft, if enabled, is created unapproved, so it
    // reads as the second case.
    const movingToOrderConfirmed =
      values.status === 'ORDER_CONFIRMED' && (!isEdit || existingEnquiry?.status !== 'ORDER_CONFIRMED');
    if (movingToOrderConfirmed && !orderConfirmAcknowledged.current) {
      const quotationStatuses = isEdit
        ? (enquiryQuotations?.records ?? []).map((quotation) => quotation.status)
        : addQuotationNow
          ? (['DRAFT'] as QuotationStatus[])
          : [];
      const warning = orderConfirmedWarning(quotationStatuses);
      if (warning) {
        setPendingOrderConfirmWarning(warning);
        return;
      }
    }

    try {
      if (isEdit) {
        const updated = await updateMutation.mutateAsync(toUpdateInput(values));
        // The status is not part of the update payload, so a pick made on the form is applied here.
        const statusChanged = Boolean(existingEnquiry) && values.status !== existingEnquiry?.status;
        if (statusChanged) {
          await statusMutation.mutateAsync(values.status);
        }
        queryClient.invalidateQueries({ queryKey: ['enquiries'] });
        queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
        // Editing the enquiry can move the quotation's event/customer details and the advance, so
        // anything cached for the record we're returning to has to be re-read.
        queryClient.invalidateQueries({ queryKey: ['quotation'] });
        queryClient.invalidateQueries({ queryKey: ['quotations'] });
        queryClient.invalidateQueries({ queryKey: ['quotations-grouped'] });
        if (statusChanged) {
          // Confirming raises the order and its tracker row, so those lists are refreshed too.
          queryClient.invalidateQueries({ queryKey: ['enquiry-timeline', id] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['payment-tracker'] });
        }
        showToast(
          statusChanged
            ? `Enquiry ${updated.enquiryNumber} updated and moved to ${resolveStatusConfig('enquiry', values.status).label}.`
            : `Enquiry ${updated.enquiryNumber} updated.`,
        );
        leaveForm({ highlightId: updated.id });
        return;
      }

      const created = await createMutation.mutateAsync(toCreateInput(values));

      if (!quotationItemsInput) {
        showToast(`Enquiry ${created.enquiryNumber} created.`);
        navigate('/enquiries', { state: { highlightId: created.id } });
        return;
      }

      try {
        const quotation = await createQuotationMutation.mutateAsync({
          source: 'ENQUIRY',
          enquiryId: created.id,
          cgstPercent: quotationTotals.cgstPercent,
          sgstPercent: quotationTotals.sgstPercent,
          advanceAmount: Number(advanceAmountValue) || 0,
          items: quotationItemsInput,
        });
        if (quotationImages.length) {
          try {
            await quotationService.uploadImages(quotation.id, quotationImages);
          } catch {
            showToast('Quotation created, but some images failed to upload.', 'error');
          }
        }
        showToast(
          `Enquiry ${created.enquiryNumber} created — quotation ${quotation.quotationNumber} created.`,
        );
        // Lands on the new enquiry's edit page rather than the Enquiry List: the quotation just
        // raised is listed there, so its status can be moved on and the enquiry's own status set
        // without navigating back in. `replace` keeps the finished create form out of the history.
        navigate(`/enquiries/${created.id}/edit`, { replace: true, state: { highlightId: created.id } });
      } catch (quotationError) {
        // The enquiry is already safely saved — surface the quotation failure on its own rather
        // than losing that, and land on the enquiry detail page where Create Quotation can be
        // retried directly.
        const message =
          isAxiosError<ApiErrorResponse>(quotationError) && quotationError.response
            ? quotationError.response.data.message
            : 'the quotation could not be created.';
        showToast(`Enquiry ${created.enquiryNumber} created, but ${message}`, 'error');
        navigate(`/enquiries/${created.id}`);
      }
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Unable to save enquiry. Please try again.');
      }
    }
  });

  // The "Save Draft or Leave?" prompt's Save Draft action (FormPage's onSaveDraft, raised by
  // useUnsavedChangesGuard when navigating away with unsaved changes). Reads the form's current,
  // unvalidated values directly rather than going through handleSubmit — a Draft is exactly the
  // enquiry saved with whatever was typed, incomplete or not (validation.ts skips its usual
  // required-field checks whenever status is DRAFT, both here and server-side). Rethrows on failure
  // so FormPage knows not to navigate away and to keep the changes on screen.
  //
  // Create mode only — an existing enquiry already has a real status (possibly Order Confirmed with
  // an order raised from it), and silently downgrading that to Draft on the way out would be far more
  // destructive than the create-mode case this is for, so the option isn't offered there at all
  // (see the FormPage element below, where onSaveDraft is passed only when !isEdit).
  async function saveAsDraft() {
    setServerError(null);
    const values = { ...getValues(), status: 'DRAFT' as const };
    try {
      const created = await createMutation.mutateAsync(toCreateInput(values));
      showToast(`Enquiry ${created.enquiryNumber} saved as a draft.`);
    } catch (error) {
      const message =
        isAxiosError<ApiErrorResponse>(error) && error.response
          ? error.response.data.message
          : 'Unable to save this enquiry as a draft. Please try again.';
      setServerError(message);
      throw error;
    }
  }

  // Nothing is editable until the enquiry it is editing has arrived: the fields are seeded from that
  // response, so anything picked or typed before it lands is overwritten the moment it does — a
  // status chosen on a still-empty form would silently snap back to the stored one.
  if (isEdit && !existingEnquiry) {
    return (
      <FormPage
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Enquiries', to: '/enquiries' },
          { label: 'Edit Enquiry' },
        ]}
        title="Edit Enquiry"
        subtitle="Update enquiry information."
        onCancel={() => leaveForm()}
        onSave={() => undefined}
        saveDisabled
        saveLabel="Update Enquiry"
      >
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: '16px' }} />
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: '16px' }} />
        <Skeleton variant="rounded" height={160} sx={{ borderRadius: '16px' }} />
      </FormPage>
    );
  }

  return (
    <FormPage
      breadcrumbs={[
        { label: 'Dashboard', to: '/' },
        { label: 'Enquiries', to: '/enquiries' },
        { label: isEdit ? 'Edit Enquiry' : 'New Enquiry' },
      ]}
      title={isEdit ? 'Edit Enquiry' : 'New Enquiry'}
      subtitle={isEdit ? 'Update enquiry information.' : 'Create a new customer enquiry.'}
      onCancel={() => leaveForm()}
      onSave={onSubmit}
      saving={saving || isSubmitting}
      saveLabel={isEdit ? 'Update Enquiry' : 'Save Enquiry'}
      isDirty={isDirty}
      onSaveDraft={!isEdit ? saveAsDraft : undefined}
      serverError={serverError}
      headerActions={showQuotationPreview ? quotationPreviewToggleButton : undefined}
      sidePanel={showQuotationPreview && quotationPreviewOpen ? quotationPreviewPanel : undefined}
      sidePanelWidth={520}
      sidePanelMinWidth={380}
      sidePanelMaxWidth={820}
      sidePanelStorageKey="enquiry-quotation-preview-width"
      variant="premium"
      maxWidth={1320}
      sectionNav={sectionNav}
      footerNote={
        <Typography variant="body2" color="text.secondary" noWrap>
          {isEdit ? existingEnquiry?.enquiryNumber : 'A new enquiry number will be generated on save.'}
          {isDirty && (
            <Box component="span" sx={{ ml: 1.5, color: 'warning.main', fontWeight: 600 }}>
              • Unsaved changes
            </Box>
          )}
        </Typography>
      }
    >
      <FormSection id={ENQUIRY_SECTION_IDS.customer} step={1} title="Customer Information" icon={<PersonIcon />}>
        {customerLocked ? (
          <EnquiryCustomerDetailsCard
            customerName={existingEnquiry?.customer.customerName ?? ''}
            mobile={existingEnquiry?.customer.mobile ?? ''}
            customer={linkedCustomer}
            isLoading={isLoadingLinkedCustomer}
            canViewCustomers={canViewCustomers}
            locked
            onEdit={canEditCustomers && linkedCustomer ? () => setEditingCustomer(true) : undefined}
          />
        ) : (
          <>
            {!isEdit && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ gridColumn: '1 / -1' }}
              >
                <CustomerTypeCard
                  icon={<PersonAddIcon />}
                  title="New Customer"
                  selected={customerType === 'NEW'}
                  onSelect={() => setValue('customerType', 'NEW', { shouldDirty: true })}
                />
                <CustomerTypeCard
                  icon={<PersonSearchIcon />}
                  title="Existing Customer"
                  selected={customerType === 'EXISTING'}
                  onSelect={() => setValue('customerType', 'EXISTING', { shouldDirty: true })}
                />
              </Stack>
            )}

            {!isEdit && customerType === 'EXISTING' ? (
              <>
                <Autocomplete
                  sx={{ gridColumn: '1 / -1' }}
                  options={customerOptions ?? []}
                  value={selectedCustomer}
                  openOnFocus
                  getOptionLabel={(option) =>
                    option.customerCode
                      ? `${option.customerName} · ${option.mobile} · ${option.customerCode}`
                      : `${option.customerName} · ${option.mobile}`
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  // Results are already filtered server-side; MUI's client-side filter would drop
                  // matches that hit fields the label doesn't show (e.g. email).
                  filterOptions={(options) => options}
                  loading={isFetchingCustomers}
                  noOptionsText={isFetchingCustomers ? 'Searching…' : 'No customers found'}
                  // Only re-search on real typing or a clear — MUI also fires this when it resets the
                  // input to the selected option's label, which would search for that label text.
                  onInputChange={(_event, value, reason) => {
                    if (reason === 'input' || reason === 'clear') setCustomerSearchInput(value);
                  }}
                  onChange={(_event, value) => {
                    setSelectedCustomer(value);
                    setValue('customerId', fromId(value?.id), { shouldDirty: true });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      autoFocus
                      label="Select or search a customer"
                      error={Boolean(errors.customerId)}
                      helperText={errors.customerId?.message}
                    />
                  )}
                />

                {selectedCustomer && (
                  <EnquiryCustomerDetailsCard
                    customerName={selectedCustomer.customerName}
                    mobile={selectedCustomer.mobile}
                    customerCode={selectedCustomer.customerCode}
                    customer={linkedCustomer}
                    isLoading={isLoadingLinkedCustomer}
                    canViewCustomers={canViewCustomers}
                    onEdit={canEditCustomers && linkedCustomer ? () => setEditingCustomer(true) : undefined}
                  />
                )}
              </>
            ) : (
              <>
                <TextField
                  label="Customer Name"
                  required
                  autoFocus
                  fullWidth
                  error={Boolean(errors.customerName)}
                  helperText={errors.customerName?.message}
                  {...register('customerName')}
                />
                <TextField
                  label="Phone Number"
                  required
                  fullWidth
                  error={Boolean(errors.mobile)}
                  helperText={errors.mobile?.message}
                  slotProps={{ htmlInput: { maxLength: 10, inputMode: 'numeric' } }}
                  {...mobileField}
                  // A 10-digit number is the only thing this field can hold, so anything else is
                  // dropped as it is typed rather than waiting for submit to reject it. Rewriting
                  // the event before handing it on keeps react-hook-form the single source of
                  // truth for the value. Pasting a formatted number ("+91 98765 43210") therefore
                  // lands as its digits, trimmed to the first ten.
                  onChange={(event) => {
                    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 10);
                    return mobileField.onChange(event);
                  }}
                />
                <Box>
                  <TextField
                    label="WhatsApp"
                    fullWidth
                    {...whatsappField}
                    // Typing here is the user taking the number over, so the mirror stops — their
                    // value would otherwise be overwritten on the next phone-number keystroke.
                    onChange={(event) => {
                      setSameAsMobile(false);
                      return whatsappField.onChange(event);
                    }}
                  />
                  <FormControlLabel
                    sx={{ mt: 0.25, ml: 0 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={sameAsMobile}
                        onChange={(event) => setSameAsMobile(event.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="caption" color="text.secondary">
                        Same as phone number
                      </Typography>
                    }
                  />
                </Box>
                <TextField
                  label="Email"
                  fullWidth
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                  {...register('email')}
                />
                <TextField label="Address" fullWidth multiline rows={2} sx={{ gridColumn: '1 / -1' }} {...register('address')} />
                <TextField label="City" fullWidth {...register('city')} />
              </>
            )}
          </>
        )}
      </FormSection>

      <FormSection
        id={ENQUIRY_SECTION_IDS.event}
        step={2}
        title="Event Information"
        subtitle="What the customer is planning."
        icon={<CelebrationIcon />}
      >
        <Controller
          name="eventTypeId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Event Type"
              required
              fullWidth
              autoFocus={isEdit}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={Boolean(errors.eventTypeId)}
              helperText={errors.eventTypeId?.message}
            >
              {eventTypes?.map((eventType) => (
                <MenuItem key={eventType.id} value={fromId(eventType.id)}>
                  {eventType.eventName}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* <TextField label="Event Name" fullWidth {...register('eventName')} /> */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>
            Event Dates &amp; Times
          </Typography>
          <Stack spacing={1.5}>
            {eventDayFields.map((row, index) => (
              <Box
                key={row.id}
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', sm: 'minmax(0, 1fr) minmax(0, 1fr) auto' },
                  alignItems: 'start',
                }}
              >
                <Controller
                  name={`eventDays.${index}.eventDate`}
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      label={index === 0 ? 'Event Date' : `Event Date ${index + 1}`}
                      required={index === 0}
                      margin="none"
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                      error={Boolean(errors.eventDays?.[index]?.eventDate)}
                      helperText={errors.eventDays?.[index]?.eventDate?.message}
                    />
                  )}
                />
                <Controller
                  name={`eventDays.${index}.eventTime`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      label="Event Time"
                      fullWidth
                      size="small"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' }, gridRow: { xs: 2, sm: 'auto' } }}
                    >
                      <MenuItem value="">
                        <em>Not set</em>
                      </MenuItem>
                      <MenuItem value="MORNING">Morning</MenuItem>
                      <MenuItem value="EVENING">Evening</MenuItem>
                    </TextField>
                  )}
                />
                <Stack
                  direction="row"
                  sx={{ gridColumn: { xs: 2, sm: 'auto' }, gridRow: { xs: 1, sm: 'auto' }, alignItems: 'center' }}
                >
                  <Tooltip title="Remove this date">
                    <span>
                      <IconButton
                        aria-label="Remove this date"
                        disabled={eventDayFields.length === 1}
                        onClick={() => removeEventDay(index)}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {index === eventDayFields.length - 1 && (
                    <Tooltip title="Add another date">
                      <IconButton
                        aria-label="Add another date"
                        color="primary"
                        onClick={() => appendEventDay({ eventDate: '', eventTime: '' })}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
        <TextField label="Mahal" fullWidth {...register('mahal')} />
        <TextField label="Venue" fullWidth {...register('venue')} />
        <TextField
          label="Estimated Budget"
          type="number"
          fullWidth
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
            htmlInput: { min: 0 },
          }}
          {...register('estimatedBudget')}
        />
        <Controller
          name="eventManagerId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Event Manager"
              fullWidth
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={Boolean(errors.eventManagerId)}
              helperText={errors.eventManagerId?.message}
            >
              <MenuItem value="">
                <em>Not set</em>
              </MenuItem>
              {users?.map((user) => (
                <MenuItem key={user.id} value={fromId(user.id)}>
                  {user.fullName}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <TextField
          label="Notes"
          fullWidth
          multiline
          rows={2}
          sx={{ gridColumn: '1 / -1' }}
          {...register('notes')}
        />
      </FormSection>

      <FormSection
        id={ENQUIRY_SECTION_IDS.appointment}
        step={3}
        title="Appointment"
        subtitle="When and where you are meeting the customer."
        icon={<CalendarMonthIcon />}
      >
        <Controller
          name="appointmentDate"
          control={control}
          render={({ field }) => (
            <DatePickerField
              label="Appointment Date"
              margin="none"
              value={field.value ? dayjs(field.value) : null}
              onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
            />
          )}
        />
        <Controller
          name="appointmentTime"
          control={control}
          render={({ field }) => (
            <TimePickerField
              label="Appointment Time"
              margin="none"
              value={field.value ? dayjs(field.value, 'hh:mm A') : null}
              onChange={(time: Dayjs | null) => field.onChange(time ? time.format('hh:mm A') : '')}
            />
          )}
        />
        <TextField
          label="Meeting Location"
          fullWidth
          {...register('meetingLocation')}
        />
        <Controller
          name="appointmentStatus"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Appointment Status"
              fullWidth
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
            >
              {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {resolveStatusConfig('appointment', option).label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <TextField
          label="Discussion Notes"
          fullWidth
          multiline
          rows={2}
          sx={{ gridColumn: '1 / -1' }}
          {...register('appointmentNotes')}
        />
        <Controller
          name="assignedUserId"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Sales Executive"
              fullWidth
              // masters/user.md §Enquiries lists Assign separately from Edit: without it the current
              // assignee is still visible, it just cannot be changed.
              disabled={!canAssign}
              helperText={canAssign ? undefined : 'You do not have permission to assign enquiries.'}
              sx={{ gridColumn: '1 / -1' }}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {users?.map((user) => (
                <MenuItem key={user.id} value={fromId(user.id)}>
                  {user.fullName}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </FormSection>

      <QuotationSection
        step={4}
        enquiry={isEdit ? (existingEnquiry ?? null) : null}
        draft={
          isEdit
            ? undefined
            : {
                enabled: addQuotationNow,
                onToggle: setAddQuotationNow,
                onCancel: cancelQuotationDraft,
                items: quotationItems,
                onItemsChange: setQuotationItems,
                cgstPercent: quotationCgst,
                sgstPercent: quotationSgst,
                onCgstChange: setQuotationCgst,
                onSgstChange: setQuotationSgst,
                totals: quotationTotals,
                error: quotationItemsError,
                advanceAmount: advanceAmountValue ?? '',
                onAdvanceChange: (value) => setValue('advanceAmount', value, { shouldDirty: true }),
                imageUrls: quotationImageUrls,
                imageCaptions: quotationImages.map((image) => image.caption),
                onImagesAdd: addQuotationImages,
                onImageCaptionChange: setQuotationImageCaption,
                onImageRemove: removeQuotationImage,
              }
        }
      />

      <FormSection
        id={ENQUIRY_SECTION_IDS.budget}
        step={hasQuotationSection ? 5 : 4}
        title="Final Budget"
        subtitle="What this enquiry becomes worth — carried straight into the order when it is confirmed."
        icon={<PaymentsIcon />}
      >
        <TextField
          label="Final Budget Amount"
          type="number"
          fullWidth
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
            htmlInput: { min: 0 },
          }}
          {...register('finalBudgetAmount')}
        />
        <TextField
          label="Advance Amount"
          type="number"
          fullWidth
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
            htmlInput: { min: 0 },
          }}
          {...register('advanceAmount')}
        />
      </FormSection>

      <EnquiryStatusSection
        step={hasQuotationSection ? 6 : 5}
        control={control}
        enquiry={isEdit ? (existingEnquiry ?? null) : null}
        // Picking a different status retracts an earlier acknowledgement, so coming back to
        // Order Confirmed asks again rather than saving silently.
        onStatusPicked={() => {
          orderConfirmAcknowledged.current = false;
        }}
      />

      {/* flow.md §3: confirmation only — confirming proceeds with the save as chosen. */}
      <ConfirmDialog
        open={pendingOrderConfirmWarning !== null}
        title="Move to Order Confirmed?"
        message={pendingOrderConfirmWarning ?? ''}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        loading={saving || isSubmitting}
        onConfirm={() => {
          orderConfirmAcknowledged.current = true;
          setPendingOrderConfirmWarning(null);
          void onSubmit();
        }}
        onClose={() => setPendingOrderConfirmWarning(null)}
      />

      {linkedCustomer && (
        <CustomerEditDialog
          open={editingCustomer}
          customer={linkedCustomer}
          onClose={() => setEditingCustomer(false)}
          onSaved={(updated) => {
            // Keeps the picker's label and the read-only card in sync immediately, without waiting
            // on the invalidated ['customer', id] query to refetch.
            if (selectedCustomer && selectedCustomer.id === updated.id) {
              setSelectedCustomer({ ...selectedCustomer, customerName: updated.customerName, mobile: updated.mobile });
            }
          }}
        />
      )}
    </FormPage>
  );
}
