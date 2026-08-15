import { zodResolver } from '@hookform/resolvers/zod';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
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
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DatePickerField } from '../../components/DatePickerField';
import { FormPage } from '../../components/FormPage';
import { FormSection } from '../../components/FormSection';
import { resolveStatusConfig } from '../../components/statusConfig';
import { StatusBadge } from '../../components/StatusBadge';
import { TimePickerField } from '../../components/TimePickerField';
import { usePermission } from '../../hooks/usePermission';
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
import { enquiryFormSchema, type EnquiryFormValues } from '../../validation/enquirySchemas';
import { CustomerEditDialog } from './CustomerEditDialog';
import { EnquiryCustomerDetailsCard } from './EnquiryCustomerDetailsCard';
import { orderConfirmedWarning } from './enquiryOrderConfirmGuard';
import { EnquiryQuotationDialog } from './EnquiryQuotationDialog';
import { useEnquiryQuotations } from './useEnquiryQuotations';
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
// Two distinct modes, because "editable" means something different in each:
// - Edit (enquiry != null): status changes go through the dedicated PATCH /enquiries/:id/status
//   endpoint (server-enforced transitions from the CURRENT status), applied immediately via a
//   confirmation dialog — there's no "unsaved" state to hold it in.
// - Create (enquiry == null): there's no record yet to PATCH, so the chosen status is just a
//   plain form field (createStatus/onCreateStatusChange) submitted along with the rest of the
//   create payload. Any of the 6 statuses may be chosen at creation — picking ORDER_CONFIRMED
//   creates the customer record immediately, server-side (see enquiries/service.ts create()).
type InitialEnquiryStatus = EnquiryStatus;

interface EnquiryStatusSectionProps {
  control: Control<EnquiryFormValues>;
  enquiry: EnquiryDetail | null;
  createStatus: InitialEnquiryStatus;
  onCreateStatusChange: (status: InitialEnquiryStatus) => void;
}

const APPOINTMENT_STATUS_OPTIONS: AppointmentStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const INITIAL_STATUS_OPTIONS: InitialEnquiryStatus[] = [
  'PENDING',
  'APPOINTMENT_FIXED',
  'QUOTATION_TO_SHARE',
  'QUOTATION_SHARED',
  'ORDER_CONFIRMED',
  'ORDER_LOST',
];

function EnquiryStatusSection({ control, enquiry, createStatus, onCreateStatusChange }: EnquiryStatusSectionProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  // masters/user.md §Enquiries — Change Status and Convert to Order are permissions of their own.
  // Confirming an enquiry is what creates the order, so that one option needs the second permission.
  const canChangeStatus = usePermission('ENQUIRIES', 'canChangeStatus');
  const canConvertToOrder = usePermission('ENQUIRIES', 'canConvertToOrder');
  const [pendingStatus, setPendingStatus] = useState<EnquiryStatus | null>(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  // "md files/Enquiry/flow.md" §3 — the pre-condition to confirm past before Order Confirmed.
  // Shares its cache with the Quotation section above, so no extra request is made.
  const { data: quotations } = useEnquiryQuotations(enquiry?.id);
  const orderConfirmWarning =
    pendingStatus === 'ORDER_CONFIRMED'
      ? orderConfirmedWarning((quotations?.records ?? []).map((quotation) => quotation.status))
      : null;

  const mutation = useMutation({
    mutationFn: (input: { status: EnquiryStatus; remarks?: string }) => {
      if (!enquiry) throw new Error('Enquiry not yet saved.');
      return enquiryService.changeStatus(enquiry.id, input.status, input.remarks);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['enquiry', enquiry?.id] });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setPendingStatus(null);
      setRemarks('');
      showToast(`Enquiry status changed to ${resolveStatusConfig('enquiry', updated.status).label}.`);
    },
  });

  function closeConfirm() {
    setPendingStatus(null);
    setRemarks('');
    setError(null);
  }

  async function handleConfirm() {
    if (!pendingStatus) return;
    setError(null);
    try {
      await mutation.mutateAsync({ status: pendingStatus, remarks: remarks.trim() || undefined });
    } catch (err) {
      if (isAxiosError<ApiErrorResponse>(err) && err.response) {
        setError(err.response.data.message);
      } else {
        setError('Unable to change status.');
      }
    }
  }

  if (!enquiry) {
    return (
      <FormSection title="Enquiry Status" subtitle="Choose the status this enquiry should start at." icon={<FlagIcon />}>
        {/* Sits above Status: the follow-up is the step that decides where the enquiry goes
            next, so it is read before the status it feeds. Saved with the form like any other
            enquiry field — unlike Status, which posts its own change immediately. */}
        <Controller
          name="followUpDate"
          control={control}
          render={({ field }) => (
            <DatePickerField
              label="Follow-up Date"
              margin="none"
              value={field.value ? dayjs(field.value) : null}
              onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              helperText="When the customer should next be contacted. Leave empty if none is due."
            />
          )}
        />
        <TextField
          select
          label="Status"
          fullWidth
          value={createStatus}
          onChange={(event) => onCreateStatusChange(event.target.value as InitialEnquiryStatus)}
          helperText="Enquiries usually start as Pending. Choosing Order Confirmed here creates the customer record straight away."
          sx={{ gridColumn: '1 / -1' }}
        >
          {INITIAL_STATUS_OPTIONS.map((option) => (
            <MenuItem
              key={option}
              value={option}
              // Starting an enquiry at Order Confirmed converts it immediately, so it follows the
              // same Convert to Order permission as the transition does.
              disabled={option === 'ORDER_CONFIRMED' && !canConvertToOrder}
            >
              {resolveStatusConfig('enquiry', option).label}
            </MenuItem>
          ))}
        </TextField>
      </FormSection>
    );
  }

  return (
    <FormSection title="Enquiry Status" subtitle="Update the enquiry's current status." icon={<FlagIcon />}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', gridColumn: '1 / -1' }}>
        <Typography variant="body2" color="text.secondary">
          Currently
        </Typography>
        <StatusBadge type="enquiry" status={enquiry.status} />
      </Stack>
      {/* Sits above Status: the follow-up is the step that decides where the enquiry goes
          next, so it is read before the status it feeds. Saved with the form like any other
          enquiry field — unlike Status, which posts its own change immediately. */}
      <Controller
        name="followUpDate"
        control={control}
        render={({ field }) => (
          <DatePickerField
            label="Follow-up Date"
            margin="none"
            value={field.value ? dayjs(field.value) : null}
            onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
            helperText="When the customer should next be contacted. Leave empty if none is due."
          />
        )}
      />
      <TextField
        select
        label="Status"
        fullWidth
        disabled={!canChangeStatus}
        value={enquiry.status}
        onChange={(event) => {
          const value = event.target.value as EnquiryStatus;
          if (value === enquiry.status) return;
          setError(null);
          setPendingStatus(value);
        }}
        helperText={
          canChangeStatus
            ? 'Select a new status to update this enquiry.'
            : 'You do not have permission to change this enquiry’s status.'
        }
        sx={{ gridColumn: '1 / -1' }}
      >
        {INITIAL_STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option}
            value={option}
            disabled={option === 'ORDER_CONFIRMED' && !canConvertToOrder}
          >
            {resolveStatusConfig('enquiry', option).label}
          </MenuItem>
        ))}
      </TextField>

      <ConfirmDialog
        open={pendingStatus !== null}
        title={`Change status to ${pendingStatus ? resolveStatusConfig('enquiry', pendingStatus).label : ''}?`}
        message={
          <Stack spacing={1.5}>
            {error && <Alert severity="error">{error}</Alert>}
            {/* flow.md §3: a warning, not a block — Yes still goes through. */}
            {orderConfirmWarning && <Alert severity="warning">{orderConfirmWarning}</Alert>}
            <TextField
              label="Remarks"
              fullWidth
              multiline
              rows={2}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              helperText="Optional"
            />
          </Stack>
        }
        loading={mutation.isPending}
        onConfirm={handleConfirm}
        onClose={closeConfirm}
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
}

// md files/enquiry.md "Quotation Section": a Quotation section is available from the enquiry so a
// quotation can be created without re-entering customer/event details. Mirrors the Enquiry Detail
// page's section — in edit mode it lists the linked quotations with a permission-/status-gated
// "Create Quotation" action. Before the enquiry is saved there is no enquiryId to link a quotation
// to yet, so instead of navigating away, this lets the items be entered inline — Save Enquiry then
// creates both records together (the enquiry first, then the quotation against its new id), and the
// backend already moves the enquiry to "Quotation to Share" the moment a quotation exists for it.
function QuotationSection({ enquiry, draft }: { enquiry: EnquiryDetail | null; draft?: QuotationDraftControls }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canCreateQuotation = usePermission('QUOTATIONS', 'canCreate');
  const canEdit = usePermission('QUOTATIONS', 'canEdit');
  const canApprove = usePermission('QUOTATIONS', 'canApprove');
  const [previewQuotationId, setPreviewQuotationId] = useState<string | null>(null);
  // "md files/Enquiry/flow.md" §2.3: Create Quotation opens a modal rather than navigating away.
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: quotations } = useEnquiryQuotations(enquiry?.id);

  // Editable Status column: every row's dropdown always offers all four of Not Shared/Shared/
  // Confirmed/Rejected (quotationStatusOptions), regardless of the row's current status. The
  // backend only actually supports DRAFT→SENT (changeStatus), SENT→APPROVED (approve — one
  // approved quotation per enquiry, docs/10_IMPLEMENTATION_DECISIONS.md), and SENT→REJECTED
  // (changeStatus); any other pick (e.g. reverting an already-shared quotation back to Not Shared)
  // has no such endpoint, so it's caught client-side with a clear message instead of silently
  // doing nothing.
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string;
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
    mutationFn: (id: string) => quotationService.changeStatus(id, 'SENT'),
    onSuccess: invalidateQuotationQueries,
  });
  const approveMutation = useMutation({
    mutationFn: (id: string) => quotationService.approve(id),
    onSuccess: () => {
      invalidateQuotationQueries();
      invalidateEnquiryQueries();
    },
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => quotationService.changeStatus(id, 'REJECTED'),
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
              />

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                Saving the enquiry will also create this quotation and move the enquiry to "Quotation to Share".
              </Typography>

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
              sx={{ minWidth: 200 }}
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
                  navigate(`/quotations/${row.id}/edit`);
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
    <FormSection title="Quotation" subtitle="Quotations linked to this enquiry." icon={<RequestQuoteIcon />}>
      <Box sx={{ gridColumn: '1 / -1' }}>
        {showCreateQuotation && (
          <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 1.5 }}>
            {/* Contained, matching the Enquiry Detail page's identical action: MUI's default text
                variant left this reading as a caption rather than an available option. */}
            <Button
              size="small"
              variant="contained"
              startIcon={<RequestQuoteIcon />}
              onClick={() => setCreateDialogOpen(true)}
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
                    `Confirm quotation "${pendingStatusChange.quotationNumber}"? This moves the enquiry to Order Confirmed and raises the order. Other quotations stay available as history.`}
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

        {/* flow.md §2.3: raised in place, and saving returns the user to the Enquiry List. */}
        <EnquiryQuotationDialog
          open={createDialogOpen}
          enquiry={{
            id: enquiry.id,
            enquiryNumber: enquiry.enquiryNumber,
            customerName: enquiry.customer.customerName,
            mobile: enquiry.customer.mobile,
            whatsapp: enquiry.prospect?.whatsapp ?? enquiry.customer.mobile,
            email: enquiry.prospect?.email ?? null,
            address: enquiry.prospect?.address ?? null,
          }}
          onClose={() => setCreateDialogOpen(false)}
          onSaved={() => {
            setCreateDialogOpen(false);
            navigate('/enquiries', { state: { highlightId: enquiry.id } });
          }}
        />
      </Box>
    </FormSection>
  );
}

interface CustomerTypeCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

// enquiry.md §Step 1 offers two ways to start an enquiry (New Customer / Existing Customer). It's
// the first decision on the form and changes which fields follow, so it's a pair of explanatory
// cards rather than a pair of small toggle buttons.
function CustomerTypeCard({ icon, title, description, selected, onSelect }: CustomerTypeCardProps) {
  return (
    <ButtonBase
      onClick={onSelect}
      aria-pressed={selected}
      sx={(theme) => ({
        flex: '1 1 240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1.5,
        p: 2,
        borderRadius: '14px',
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
      <Box sx={{ display: 'flex', color: selected ? 'primary.main' : 'text.secondary' }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {description}
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
  const customer: CustomerInput =
    values.customerType === 'EXISTING'
      ? { type: 'EXISTING', customerId: values.customerId! }
      : {
          type: 'NEW',
          customerName: values.customerName!,
          mobile: values.mobile!,
          whatsapp: cleanOptional(values.whatsapp),
          email: cleanOptional(values.email),
          address: cleanOptional(values.address),
          city: cleanOptional(values.city),
        };

  return {
    customer,
    eventTypeId: values.eventTypeId,
    eventName: cleanOptional(values.eventName),
    eventDate: cleanOptional(values.eventDate),
    eventTime: cleanOptional(values.eventTime) as CreateEnquiryInput['eventTime'],
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
    assignedUserId: cleanOptional(values.assignedUserId),
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
  // A still-unconfirmed enquiry (customerType NEW) keeps its customer details on the enquiry itself,
  // so edits to them are sent as prospect fields. A linked (EXISTING) enquiry's customer is locked.
  if (values.customerType === 'NEW') {
    return {
      ...rest,
      followUpDate,
      customerName: values.customerName ?? '',
      mobile: values.mobile ?? '',
      whatsapp: cleanOptional(values.whatsapp),
      email: cleanOptional(values.email),
      address: cleanOptional(values.address),
      city: cleanOptional(values.city),
    };
  }
  return { ...rest, followUpDate };
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
  eventDate: '',
  eventTime: '',
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
  status: 'PENDING',
};

export default function EnquiryFormPage() {
  const { id } = useParams<{ id: string }>();
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

  function leaveForm(fallbackState?: { highlightId: string }) {
    if (returnTo) navigate(returnTo);
    else navigate('/enquiries', fallbackState ? { state: fallbackState } : undefined);
  }

  const [serverError, setServerError] = useState<string | null>(null);
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [sameAsMobile, setSameAsMobile] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);

  // Inline "create a quotation together with this enquiry" draft — create mode only. Kept as plain
  // state rather than part of the enquiry form/schema since it submits as a separate request only
  // after the enquiry itself is saved.
  const [addQuotationNow, setAddQuotationNow] = useState(false);
  const [quotationItems, setQuotationItems] = useState<QuotationDraftItem[]>([{ ...EMPTY_QUOTATION_DRAFT_ITEM }]);
  const [quotationCgst, setQuotationCgst] = useState('');
  const [quotationSgst, setQuotationSgst] = useState('');
  const [quotationItemsError, setQuotationItemsError] = useState<string | null>(null);
  const [quotationPreviewOpen, setQuotationPreviewOpen] = useState(true);

  // "md files/Enquiry/flow.md" §3 — create mode's Order Confirmed confirmation. The message is
  // held in state to show the popup; the acknowledgement is a ref because onSubmit re-runs from
  // the popup's own handler and has to see the answer within the same tick.
  const [pendingOrderConfirmWarning, setPendingOrderConfirmWarning] = useState<string | null>(null);
  const orderConfirmAcknowledged = useRef(false);

  const { data: existingEnquiry } = useQuery({
    queryKey: ['enquiry', id],
    queryFn: () => enquiryService.getById(id!),
    enabled: isEdit,
  });

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
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!existingEnquiry) return;
    // A prospect enquiry (no Customer row yet) is edited like a NEW customer — its details live in
    // the `prospect` block and stay editable. A linked enquiry's customer is fixed (EXISTING).
    const isProspect = existingEnquiry.customer.id === null;
    reset({
      ...EMPTY_VALUES,
      customerType: isProspect ? 'NEW' : 'EXISTING',
      customerId: existingEnquiry.customer.id ?? '',
      customerName: existingEnquiry.prospect?.customerName ?? '',
      mobile: existingEnquiry.prospect?.mobile ?? '',
      whatsapp: existingEnquiry.prospect?.whatsapp ?? '',
      email: existingEnquiry.prospect?.email ?? '',
      address: existingEnquiry.prospect?.address ?? '',
      city: existingEnquiry.prospect?.city ?? '',
      eventTypeId: existingEnquiry.eventType.id,
      eventName: existingEnquiry.eventName ?? '',
      eventDate: existingEnquiry.eventDate ?? '',
      eventTime: existingEnquiry.eventTime ?? '',
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
      assignedUserId: existingEnquiry.assignedUser?.id ?? '',
      followUpDate: existingEnquiry.followUpDate ?? '',
    });
    if (!isProspect) {
      setSelectedCustomer({
        id: existingEnquiry.customer.id as string,
        customerCode: '',
        customerName: existingEnquiry.customer.customerName,
        mobile: existingEnquiry.customer.mobile,
      });
    }
    setSameAsMobile(
      Boolean(existingEnquiry.prospect?.mobile) && existingEnquiry.prospect?.mobile === existingEnquiry.prospect?.whatsapp,
    );
  }, [existingEnquiry, reset]);

  const customerType = watch('customerType');
  const mobileValue = watch('mobile');
  const whatsappValue = watch('whatsapp');
  const customerNameValue = watch('customerName');
  const emailValue = watch('email');
  const addressValue = watch('address');

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

  const updateMutation = useMutation({
    mutationFn: (input: UpdateEnquiryInput) => enquiryService.update(id!, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiry', id] });
      showToast(`Enquiry ${updated.enquiryNumber} updated.`);
      // Editing an enquiry can move the quotation's event/customer details, so anything cached for
      // the record we're returning to has to be re-read.
      if (returnTo) {
        queryClient.invalidateQueries({ queryKey: ['quotation'] });
        queryClient.invalidateQueries({ queryKey: ['quotations-grouped'] });
      }
      leaveForm({ highlightId: updated.id });
    },
  });

  // The backend already moves an enquiry to QUOTATION_TO_SHARE the instant a quotation exists for
  // it (quotations/service.ts create()), so creating this quotation IS the "auto-update" — no
  // separate status call is needed here.
  const createQuotationMutation = useMutation({
    mutationFn: (input: CreateQuotationInput) => quotationService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotations'] }),
  });

  const saving = createMutation.isPending || updateMutation.isPending || createQuotationMutation.isPending;

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
          quotationDate={formatDate(new Date().toISOString())}
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
          images={[]}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', flexShrink: 0 }}>
        Sample decor images can be added once the quotation is saved.
      </Typography>
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

    // "md files/Enquiry/flow.md" §3 — creating an enquiry straight into Order Confirmed gets the
    // same confirmation as changing an existing enquiry's status. A new enquiry has no quotation
    // yet; the inline draft, if enabled, is created unapproved, so it reads as the second case.
    if (!isEdit && values.status === 'ORDER_CONFIRMED' && !orderConfirmAcknowledged.current) {
      const warning = orderConfirmedWarning(addQuotationNow ? ['DRAFT'] : []);
      if (warning) {
        setPendingOrderConfirmWarning(warning);
        return;
      }
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(toUpdateInput(values));
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
          items: quotationItemsInput,
        });
        showToast(
          `Enquiry ${created.enquiryNumber} created — quotation ${quotation.quotationNumber} created and the enquiry moved to Quotation to Share.`,
        );
        // flow.md §2.3: saving a quotation raised from an enquiry lands on the Enquiry List.
        navigate('/enquiries', { state: { highlightId: created.id } });
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
      serverError={serverError}
      headerActions={showQuotationPreview ? quotationPreviewToggleButton : undefined}
      sidePanel={showQuotationPreview && quotationPreviewOpen ? quotationPreviewPanel : undefined}
      sidePanelWidth={520}
      sidePanelMinWidth={380}
      sidePanelMaxWidth={820}
      sidePanelStorageKey="enquiry-quotation-preview-width"
    >
      <FormSection title="Customer Information" icon={<PersonIcon />}>
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
                  description="Visiting for the first time — enter their details below."
                  selected={customerType === 'NEW'}
                  onSelect={() => setValue('customerType', 'NEW', { shouldDirty: true })}
                />
                <CustomerTypeCard
                  icon={<PersonSearchIcon />}
                  title="Existing Customer"
                  description="Search the customer master — no duplicate record is created."
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
                    setValue('customerId', value?.id ?? '', { shouldDirty: true });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      autoFocus
                      label="Select or search a customer"
                      error={Boolean(errors.customerId)}
                      helperText={
                        errors.customerId?.message ??
                        'Pick from the list, or type to search by name, mobile number, or customer code.'
                      }
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
                  placeholder="e.g. Priya Sharma"
                  error={Boolean(errors.customerName)}
                  helperText={errors.customerName?.message}
                  {...register('customerName')}
                />
                <TextField
                  label="Phone Number"
                  required
                  fullWidth
                  placeholder="10-digit mobile number"
                  error={Boolean(errors.mobile)}
                  helperText={errors.mobile?.message}
                  {...register('mobile')}
                />
                <Box>
                  <TextField
                    label="WhatsApp"
                    fullWidth
                    placeholder="If different from mobile"
                    disabled={sameAsMobile}
                    {...register('whatsapp')}
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
                  placeholder="name@example.com"
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

      <FormSection title="Event Information" subtitle="What the customer is planning." icon={<CelebrationIcon />}>
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
                <MenuItem key={eventType.id} value={eventType.id}>
                  {eventType.eventName}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* <TextField label="Event Name" fullWidth {...register('eventName')} /> */}
        <Controller
          name="eventDate"
          control={control}
          render={({ field }) => (
            <DatePickerField
              label="Event Date"
              required
              margin="none"
              value={field.value ? dayjs(field.value) : null}
              onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              error={Boolean(errors.eventDate)}
              helperText={errors.eventDate?.message}
            />
          )}
        />
        <Controller
          name="eventTime"
          control={control}
          render={({ field }) => (
            <TextField
              select
              label="Event Time"
              fullWidth
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              inputRef={field.ref}
              error={Boolean(errors.eventTime)}
              helperText={errors.eventTime?.message}
            >
              <MenuItem value="">
                <em>Not set</em>
              </MenuItem>
              <MenuItem value="MORNING">Morning</MenuItem>
              <MenuItem value="EVENING">Evening</MenuItem>
            </TextField>
          )}
        />
        <TextField label="Mahal" fullWidth placeholder="e.g. Sri Krishna Mahal" {...register('mahal')} />
        <TextField label="Venue" fullWidth placeholder="Hall, address, or landmark" {...register('venue')} />
        <TextField
          label="Estimated Budget"
          type="number"
          fullWidth
          placeholder="0"
          helperText="The customer's expected spend — refine it later with the quotation."
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
            htmlInput: { min: 0 },
          }}
          {...register('estimatedBudget')}
        />
        <TextField
          label="Notes"
          fullWidth
          multiline
          rows={2}
          placeholder="Anything worth remembering about this enquiry"
          sx={{ gridColumn: '1 / -1' }}
          {...register('notes')}
        />
      </FormSection>

      <FormSection
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
          placeholder="e.g. Office, customer's home, venue site"
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
          placeholder="What was discussed, what the customer asked for"
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
                <MenuItem key={user.id} value={user.id}>
                  {user.fullName}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </FormSection>

      <QuotationSection
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
              }
        }
      />

      <FormSection
        title="Final Budget"
        subtitle="What this enquiry becomes worth — carried straight into the order when it is confirmed."
        icon={<PaymentsIcon />}
      >
        <TextField
          label="Final Budget Amount"
          type="number"
          fullWidth
          placeholder="0"
          helperText="Auto-filled from the approved quotation. Whatever stands here becomes the order's budget."
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
          placeholder="0"
          helperText="Already collected — recorded as the order's opening advance receipt (Cash) on confirmation."
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> },
            htmlInput: { min: 0 },
          }}
          {...register('advanceAmount')}
        />
      </FormSection>

      <EnquiryStatusSection
        control={control}
        enquiry={isEdit ? (existingEnquiry ?? null) : null}
        createStatus={watch('status')}
        onCreateStatusChange={(status) => {
          // Picking a different status retracts an earlier acknowledgement, so coming back to
          // Order Confirmed asks again rather than saving silently.
          orderConfirmAcknowledged.current = false;
          setValue('status', status, { shouldDirty: true });
        }}
      />

      <Box>
        <Typography variant="caption" color="text.secondary">
          {isEdit ? existingEnquiry?.enquiryNumber : 'A new enquiry number will be generated on save.'}
        </Typography>
      </Box>

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
