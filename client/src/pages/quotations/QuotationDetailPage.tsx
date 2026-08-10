import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import LinkIcon from '@mui/icons-material/Link';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PrintIcon from '@mui/icons-material/Print';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SendIcon from '@mui/icons-material/Send';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusBadge } from '../../components/StatusBadge';
import { Button } from '../../components/ui/Button';
import { CARD_SURFACE } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';
import { Menu, MenuItem } from '../../components/ui/Menu';
import { SCROLL_ANCHORS } from '../../constants/scrollAnchors';
import { usePermission } from '../../hooks/usePermission';
import * as enquiryService from '../../services/enquiryService';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type { QuotationDetail } from '../../types/quotation';
import { formatCurrency, formatDate } from '../../utils/format';
import { QuotationActivityDrawer } from './QuotationActivityDrawer';
import { QuotationPreviewDialog } from './QuotationPreviewDialog';
import { buildQuotationWhatsAppLink, canShareQuotation } from './quotationActions';
import { isQuotationEditable } from './quotationStatusTransitions';

type PendingAction = 'send' | 'reject' | 'approve' | 'convert' | 'whatsapp';

function DetailSkeleton() {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div className="tw-h-20 tw-animate-pulse tw-rounded-card tw-bg-slate-100 dark:tw-bg-slate-700" />
      <div className="tw-grid tw-gap-4 md:tw-grid-cols-2">
        <div className="tw-h-44 tw-animate-pulse tw-rounded-card tw-bg-slate-100 dark:tw-bg-slate-700" />
        <div className="tw-h-44 tw-animate-pulse tw-rounded-card tw-bg-slate-100 dark:tw-bg-slate-700" />
      </div>
      <div className="tw-h-80 tw-animate-pulse tw-rounded-card tw-bg-slate-100 dark:tw-bg-slate-700" />
    </div>
  );
}

// One quotation, three blocks: who it is for, what it is for, and what it says. Everything else a
// quotation carries — its other versions, its audit trail, its PDF — is reachable from the header
// without competing with those three for the reader's attention.
export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const canEdit = usePermission('QUOTATIONS', 'canEdit');
  const canCreate = usePermission('QUOTATIONS', 'canCreate');
  const canPrint = usePermission('QUOTATIONS', 'canPrint');
  const canApprove = usePermission('QUOTATIONS', 'canApprove');
  const canEditEnquiry = usePermission('ENQUIRIES', 'canEdit');
  // Converting drives the enquiry to ORDER_CONFIRMED (see convertMutation below), so it takes the
  // two enquiry permissions that guard that transition rather than an Orders one.
  const canChangeEnquiryStatus = usePermission('ENQUIRIES', 'canChangeStatus');
  const canConvertToOrder = usePermission('ENQUIRIES', 'canConvertToOrder');

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.getById(id!),
    enabled: Boolean(id),
  });

  const editable = Boolean(quotation) && canEdit && isQuotationEditable(quotation!.status);

  // "E" opens the editor without reaching for the mouse (cr1.md §UX Improvements). Ignored while
  // a field or a dialog has focus, so typing an "e" into a search box never navigates away.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'e' && event.key !== 'E') return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      if (!editable || !id) return;
      event.preventDefault();
      navigate(`/quotations/${id}/edit`);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editable, id, navigate]);

  function invalidateAfterAction() {
    queryClient.invalidateQueries({ queryKey: ['quotation', id] });
    queryClient.invalidateQueries({ queryKey: ['quotation-timeline', id] });
    queryClient.invalidateQueries({ queryKey: ['quotations-grouped'] });
    queryClient.invalidateQueries({ queryKey: ['quotations', 'stats'] });
    queryClient.invalidateQueries({ queryKey: ['enquiry'] });
    queryClient.invalidateQueries({ queryKey: ['enquiries'] });
  }

  const sendMutation = useMutation({
    mutationFn: () => quotationService.changeStatus(id!, 'SENT'),
    onSuccess: invalidateAfterAction,
  });
  const rejectMutation = useMutation({
    mutationFn: () => quotationService.changeStatus(id!, 'REJECTED'),
    onSuccess: invalidateAfterAction,
  });
  const approveMutation = useMutation({
    mutationFn: () => quotationService.approve(id!),
    onSuccess: invalidateAfterAction,
  });

  // An order is only ever created by confirming the enquiry — the server converts automatically the
  // moment an enquiry reaches ORDER_CONFIRMED (enquiries/service.ts changeStatus → orders/service.ts
  // autoConvertFromEnquiry). This button drives that documented step rather than a second path into
  // the Orders table, then re-reads the quotation to pick up the order it produced.
  const convertMutation = useMutation({
    mutationFn: async (enquiryId: string) => {
      await enquiryService.changeStatus(enquiryId, 'ORDER_CONFIRMED');
      return quotationService.getById(id!);
    },
    onSuccess: (refreshed) => {
      invalidateAfterAction();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (refreshed.convertedOrder) {
        showToast(`Order ${refreshed.convertedOrder.orderNumber} created from this quotation.`);
        navigate(`/orders/${refreshed.convertedOrder.id}`);
      } else {
        showToast(
          'The enquiry is confirmed, but the order could not be created automatically. Try again, or open the enquiry and confirm it has a linked customer.',
          'error',
        );
      }
    },
  });

  const actionPending =
    sendMutation.isPending || rejectMutation.isPending || approveMutation.isPending || convertMutation.isPending;

  async function copyToClipboard(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copied.`);
    } catch {
      showToast(`Unable to copy the ${label.toLowerCase()}.`, 'error');
    }
  }

  async function handleDownload() {
    if (!quotation) return;
    try {
      await quotationService.downloadPdf(quotation.id, `${quotation.quotationNumber}-v${quotation.version}.pdf`);
    } catch {
      showToast('Unable to download the quotation PDF.', 'error');
    }
  }

  async function handlePrint() {
    if (!quotation) return;
    try {
      await quotationService.openPdf(quotation.id);
    } catch {
      showToast('Unable to open the quotation PDF.', 'error');
    }
  }

  function openWhatsApp() {
    if (!quotation) return;
    const link = buildQuotationWhatsAppLink({
      quotationNumber: quotation.quotationNumber,
      recipientName: quotation.recipient.name,
      whatsapp: quotation.whatsappNumber,
      phone: quotation.recipient.phone,
    });
    if (!link) {
      showToast('No WhatsApp number is available for this quotation.', 'error');
      return;
    }
    window.open(link, '_blank', 'noopener');
  }

  async function runPendingAction() {
    if (!quotation || !pendingAction) return;
    setActionError(null);

    if (pendingAction === 'whatsapp') {
      setPendingAction(null);
      openWhatsApp();
      return;
    }

    try {
      if (pendingAction === 'send') await sendMutation.mutateAsync();
      else if (pendingAction === 'reject') await rejectMutation.mutateAsync();
      else if (pendingAction === 'approve') await approveMutation.mutateAsync();
      else if (pendingAction === 'convert') await convertMutation.mutateAsync(quotation.link.enquiry!.id);
      setPendingAction(null);
    } catch (error) {
      setPendingAction(null);
      if (isAxiosError<ApiErrorResponse>(error) && error.response) setActionError(error.response.data.message);
      else setActionError('Action failed. Please try again.');
    }
  }

  if (isLoading) return <DetailSkeleton />;

  if (!quotation) {
    return (
      <div className={`${CARD_SURFACE} tw-p-12 tw-text-center`}>
        <h2 className="tw-mb-1 tw-text-xl tw-font-bold tw-text-ink dark:tw-text-ink-dark">Quotation not found</h2>
        <p className="tw-mb-6 tw-text-sm tw-text-ink-muted dark:tw-text-ink-dark-muted">
          It may have been deleted, or the link is no longer valid.
        </p>
        <Button variant="primary" startIcon={<ArrowBackIcon fontSize="small" />} onClick={() => navigate('/quotations')}>
          Back to Quotations
        </Button>
      </div>
    );
  }

  const enquiry = quotation.link.enquiry;
  // No approval-based gating on either action — "md files/Enquiry/enq.md" §2: unlimited revisions,
  // and no restriction on confirming any quotation. An already-confirmed quotation is the one
  // exception, since confirming it twice would double-count it in the enquiry's committed total.
  const showCreateRevision = Boolean(enquiry) && canCreate;
  const showApprove = Boolean(enquiry) && canApprove && quotation.status !== 'APPROVED';
  const showConvert =
    Boolean(enquiry) &&
    canChangeEnquiryStatus &&
    canConvertToOrder &&
    quotation.status === 'APPROVED' &&
    !quotation.convertedOrder;
  const shareable = canShareQuotation(quotation.status);

  // Exactly one status action is ever available, so the header carries that one beside Edit and
  // leaves the rest of the toolbar quiet.
  const primaryStatusAction: ReactNode = (() => {
    if (showConvert) {
      return (
        <Button
          variant="primary"
          startIcon={<ShoppingCartCheckoutIcon fontSize="small" />}
          onClick={() => setPendingAction('convert')}
        >
          Convert To Order
        </Button>
      );
    }
    if (canEdit && quotation.status === 'DRAFT') {
      return (
        <Button variant="outlined" startIcon={<SendIcon fontSize="small" />} onClick={() => setPendingAction('send')}>
          Mark as Sent
        </Button>
      );
    }
    if (showApprove) {
      return (
        <Button
          variant="outlined"
          startIcon={<CheckCircleIcon fontSize="small" />}
          onClick={() => setPendingAction('approve')}
        >
          Confirm Quotation
        </Button>
      );
    }
    if (quotation.convertedOrder) {
      return (
        <Button
          variant="outlined"
          startIcon={<ShoppingCartCheckoutIcon fontSize="small" />}
          onClick={() => navigate(`/orders/${quotation.convertedOrder!.id}`)}
        >
          View Order
        </Button>
      );
    }
    return null;
  })();

  const subtotal = Number(quotation.subtotal);
  const discount = Number(quotation.discount);
  const tax = Number(quotation.tax);
  const cgstPercent = Number(quotation.cgstPercent);
  const sgstPercent = Number(quotation.sgstPercent);
  const taxable = subtotal - discount;
  const cgstAmount = Math.round(((taxable * cgstPercent) / 100) * 100) / 100;
  const sgstAmount = Math.round(((taxable * sgstPercent) / 100) * 100) / 100;

  const confirmCopy = CONFIRM_COPY[pendingAction ?? 'send'];

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'Quotations', to: '/quotations' },
          { label: quotation.quotationNumber },
        ]}
      />

      {/* Header: what this document is, and the few things you would do to it. */}
      <div className={`${CARD_SURFACE} tw-mb-4 tw-p-4`}>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
          <div className="tw-min-w-0">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              <h1 className="tw-m-0 tw-text-xl tw-font-bold tw-leading-tight tw-tabular-nums tw-text-ink dark:tw-text-ink-dark">
                {quotation.quotationNumber}
              </h1>
              <IconButton
                title="Copy quotation number"
                size="xs"
                onClick={() => void copyToClipboard(quotation.quotationNumber, 'Quotation number')}
              >
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <StatusBadge type="quotation" status={quotation.status} />
              <span className="tw-inline-flex tw-h-6 tw-items-center tw-rounded-full tw-border tw-border-hairline tw-bg-white tw-px-2 tw-text-[0.6875rem] tw-font-bold tw-text-ink dark:tw-border-hairline-dark dark:tw-bg-surface-dark dark:tw-text-ink-dark">
                v{quotation.version}
                {quotation.revisions.length > 1 ? ` of ${quotation.revisions.length}` : ''}
              </span>
            </div>
            <p className="tw-mb-0 tw-mt-1 tw-text-[0.8125rem] tw-text-ink-muted dark:tw-text-ink-dark-muted">
              {formatDate(quotation.quotationDate)}
              {enquiry ? ` · Enquiry ${enquiry.enquiryNumber}` : ''}
              {quotation.owner ? ` · ${quotation.owner.fullName}` : ''}
            </p>
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
            {editable && (
              <Button
                variant="primary"
                startIcon={<EditIcon fontSize="small" />}
                title="Edit quotation (E)"
                onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
              >
                Edit
              </Button>
            )}
            {primaryStatusAction}
            {canPrint && (
              <IconButton title="Download PDF" onClick={() => void handleDownload()}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            )}
            {shareable && (
              <IconButton title="Send on WhatsApp" onClick={() => setPendingAction('whatsapp')}>
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton
              title="More actions"
              onClick={(event) => {
                const trigger = event.currentTarget;
                setMenuAnchor((current) => (current ? null : trigger));
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </div>
        </div>

        {actionError && (
          <div className="tw-mt-3 tw-rounded-control tw-border tw-border-danger/40 tw-bg-danger/10 tw-px-3 tw-py-2 tw-text-sm tw-text-danger">
            {actionError}
          </div>
        )}
      </div>

      <div className="tw-mb-4 tw-grid tw-gap-4 md:tw-grid-cols-2">
        <Panel title="Customer">
          <Field label="Name" value={quotation.recipient.name} />
          <Field
            label="Phone"
            value={
              quotation.recipient.phone ? (
                <a href={`tel:${quotation.recipient.phone}`} className="tw-text-brand tw-no-underline hover:tw-underline">
                  {quotation.recipient.phone}
                </a>
              ) : null
            }
          />
          <Field label="WhatsApp" value={quotation.recipient.whatsapp ?? quotation.whatsappNumber} />
          <Field
            label="Email"
            value={
              quotation.recipient.email ? (
                <a href={`mailto:${quotation.recipient.email}`} className="tw-text-brand tw-no-underline hover:tw-underline">
                  {quotation.recipient.email}
                </a>
              ) : null
            }
          />
          <Field label="Address" value={quotation.recipient.address} />
        </Panel>

        <Panel
          title="Event"
          action={
            // Enquiry fields are never mixed into the quotation editor (cr1.md §Edit Enquiry): this
            // hands off to the enquiry's own form and comes straight back here on save.
            enquiry && canEditEnquiry ? (
              <Button
                size="sm"
                variant="ghost"
                startIcon={<EditIcon fontSize="small" />}
                onClick={() =>
                  navigate(`/enquiries/${enquiry.id}/edit`, { state: { returnTo: `/quotations/${quotation.id}` } })
                }
              >
                Edit
              </Button>
            ) : undefined
          }
        >
          {quotation.event ? (
            <>
              <Field label="Event Type" value={quotation.event.eventType} />
              <Field label="Event Name" value={quotation.event.eventName} />
              <Field
                label="Function Date"
                value={quotation.event.eventDate ? formatDate(quotation.event.eventDate) : null}
              />
              <Field label="Mahal" value={quotation.event.mahal} />
              <Field label="Venue" value={quotation.event.venue} />
            </>
          ) : (
            <p className="tw-m-0 tw-text-sm tw-text-ink-muted dark:tw-text-ink-dark-muted">
              This quotation was not raised from an enquiry, so it has no event details.
            </p>
          )}
        </Panel>
      </div>

      {/* Every version raised against this enquiry, on the page rather than behind a drawer: a row
          opens that version, and the pencil edits it while its status still allows it. Standalone
          Customer/Manual quotations are never versioned, so they have no list to show. Shown
          before the quotation's own line items so the reader sees which version this is among
          before reading what it says. */}
      {quotation.revisions.length > 0 && (
        <div className={`${CARD_SURFACE} tw-mb-4 tw-overflow-hidden`}>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-border-b tw-border-hairline tw-px-4 tw-py-3 dark:tw-border-hairline-dark">
            <h2 className="tw-m-0 tw-text-sm tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-ink-muted dark:tw-text-ink-dark-muted">
              Quotations ({quotation.revisions.length})
            </h2>
            {showCreateRevision && (
              <Button
                size="sm"
                variant="ghost"
                startIcon={<RequestQuoteIcon fontSize="small" />}
                onClick={() =>
                  navigate(`/quotations/new?enquiryId=${enquiry!.id}`, {
                    state: { scrollTo: SCROLL_ANCHORS.quotationItems },
                  })
                }
              >
                Create Revision
              </Button>
            )}
          </div>

          <PlainTable
            rows={quotation.revisions}
            getRowId={(revision) => revision.id}
            isRowActive={(revision) => revision.id === quotation.id}
            onRowClick={(revision) => {
              if (revision.id !== quotation.id) navigate(`/quotations/${revision.id}`);
            }}
            columns={[
              {
                key: 'quotationNumber',
                header: 'Quotation No',
                width: 'auto',
                numeric: true,
                strong: true,
                render: (revision) => (
                  <>
                    {revision.quotationNumber}
                    {revision.id === quotation.id && (
                      <span className="tw-ml-2 tw-text-[0.625rem] tw-font-bold tw-uppercase tw-text-brand">Viewing</span>
                    )}
                  </>
                ),
              },
              {
                key: 'version',
                header: 'Version',
                width: '12%',
                numeric: true,
                render: (revision) => `v${revision.version}`,
              },
              {
                key: 'date',
                header: 'Date',
                width: '18%',
                muted: true,
                render: (revision) => formatDate(revision.quotationDate),
              },
              {
                key: 'amount',
                header: 'Amount',
                align: 'right',
                width: '18%',
                numeric: true,
                strong: true,
                render: (revision) => formatCurrency(revision.totalAmount),
              },
              {
                key: 'status',
                header: 'Status',
                align: 'center',
                width: '15%',
                render: (revision) => <StatusBadge type="quotation" status={revision.status} size="sm" />,
              },
              {
                key: 'actions',
                header: 'Actions',
                align: 'center',
                width: '110px',
                render: (revision) => (
                  <span className="tw-flex tw-justify-center tw-gap-0.5">
                    <IconButton
                      title={revision.id === quotation.id ? 'Currently viewing' : `View v${revision.version}`}
                      size="sm"
                      disabled={revision.id === quotation.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/quotations/${revision.id}`);
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    {canEdit && isQuotationEditable(revision.status) && (
                      <IconButton
                        title={`Edit v${revision.version}`}
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/quotations/${revision.id}/edit`);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </span>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* The quotation itself: what was quoted, and what it comes to. */}
      <div className={`${CARD_SURFACE} tw-overflow-hidden`}>
        <div className="tw-border-b tw-border-hairline tw-px-4 tw-py-3 dark:tw-border-hairline-dark">
          <h2 className="tw-m-0 tw-text-sm tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-ink-muted dark:tw-text-ink-dark-muted">
            Quotation
          </h2>
        </div>

        <PlainTable
          rows={quotation.items}
          getRowId={(item) => item.id}
          emptyMessage="This quotation has no line items."
          columns={[
            {
              key: 'item',
              header: 'Item',
              width: 'auto',
              render: (item) => item.itemName,
            },
            {
              key: 'qty',
              header: 'Qty',
              align: 'right',
              width: '15%',
              numeric: true,
              render: (item) => `${Number(item.quantity).toLocaleString('en-IN')}${item.unit ? ` ${item.unit}` : ''}`,
            },
            {
              key: 'rate',
              header: 'Rate',
              align: 'right',
              width: '20%',
              numeric: true,
              muted: true,
              render: (item) => formatCurrency(item.rate),
            },
            {
              key: 'amount',
              header: 'Amount',
              align: 'right',
              width: '20%',
              numeric: true,
              strong: true,
              render: (item) => formatCurrency(item.amount),
            },
          ]}
        />

        {/* Totals sit right-aligned under the items, the way they read on the printed document. */}
        <div className="tw-flex tw-justify-end tw-px-4 tw-py-4">
          <dl className="tw-m-0 tw-w-full tw-max-w-[280px]">
            <AmountRow label="Subtotal" value={formatCurrency(subtotal)} />
            {discount > 0 && <AmountRow label="Discount" value={`- ${formatCurrency(discount)}`} />}
            {cgstPercent > 0 && <AmountRow label={`CGST (${cgstPercent}%)`} value={formatCurrency(cgstAmount)} />}
            {sgstPercent > 0 && <AmountRow label={`SGST (${sgstPercent}%)`} value={formatCurrency(sgstAmount)} />}
            {cgstPercent === 0 && sgstPercent === 0 && <AmountRow label="Tax" value={formatCurrency(tax)} />}
            <div className="tw-mt-2 tw-flex tw-items-baseline tw-justify-between tw-gap-2 tw-border-t tw-border-hairline tw-pt-2 dark:tw-border-hairline-dark">
              <dt className="tw-text-xs tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-ink-muted dark:tw-text-ink-dark-muted">
                Grand Total
              </dt>
              <dd className="tw-m-0 tw-text-2xl tw-font-bold tw-tabular-nums tw-text-ink dark:tw-text-ink-dark">
                {formatCurrency(quotation.totalAmount)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Notes only appear when there are any — an empty "no notes" block is noise. */}
        {quotation.remarks && (
          <div className="tw-border-t tw-border-hairline tw-px-4 tw-py-3 dark:tw-border-hairline-dark">
            <h3 className="tw-m-0 tw-mb-1 tw-text-[0.6875rem] tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-ink-muted dark:tw-text-ink-dark-muted">
              Notes
            </h3>
            <p className="tw-m-0 tw-whitespace-pre-line tw-text-sm tw-text-ink dark:tw-text-ink-dark">
              {quotation.remarks}
            </p>
          </div>
        )}
      </div>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} align="right">
        <MenuItem
          icon={<VisibilityIcon fontSize="small" />}
          onClick={() => {
            setPreviewOpen(true);
            setMenuAnchor(null);
          }}
        >
          Preview Document
        </MenuItem>
        {canPrint && (
          <MenuItem
            icon={<PrintIcon fontSize="small" />}
            onClick={() => {
              void handlePrint();
              setMenuAnchor(null);
            }}
          >
            Print
          </MenuItem>
        )}
        <MenuItem
          icon={<HistoryIcon fontSize="small" />}
          onClick={() => {
            setActivityOpen(true);
            setMenuAnchor(null);
          }}
        >
          Activity Log
        </MenuItem>
        <MenuItem
          icon={<LinkIcon fontSize="small" />}
          onClick={() => {
            void copyToClipboard(window.location.href, 'Link');
            setMenuAnchor(null);
          }}
        >
          Copy Link
        </MenuItem>
        {enquiry && (
          <MenuItem
            icon={<ListAltIcon fontSize="small" />}
            onClick={() => {
              navigate(`/enquiries/${enquiry.id}`);
              setMenuAnchor(null);
            }}
          >
            View Enquiry
          </MenuItem>
        )}
        {canEdit && quotation.status === 'SENT' && (
          <MenuItem
            icon={<CancelIcon fontSize="small" />}
            onClick={() => {
              setPendingAction('reject');
              setMenuAnchor(null);
            }}
          >
            Reject Quotation
          </MenuItem>
        )}
      </Menu>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={confirmCopy.title}
        message={confirmCopy.message(quotation)}
        confirmLabel={confirmCopy.confirmLabel}
        danger={confirmCopy.danger}
        loading={actionPending}
        onConfirm={() => void runPendingAction()}
        onClose={() => setPendingAction(null)}
      />

      <QuotationActivityDrawer open={activityOpen} quotationId={quotation.id} onClose={() => setActivityOpen(false)} />

      <QuotationPreviewDialog quotationId={previewOpen ? quotation.id : null} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

interface PlainColumn<T> {
  key: string;
  header: string;
  /** Applied to the header cell AND the body cells, so the two can never disagree. Defaults to left. */
  align?: 'left' | 'right' | 'center';
  /** A `<col>` width, so the columns hold their proportions instead of being sized by content. */
  width?: string;
  /** Tabular figures — digits share one advance width, so numbers line up down the column. */
  numeric?: boolean;
  strong?: boolean;
  muted?: boolean;
  render: (row: T) => ReactNode;
}

interface PlainTableProps<T> {
  columns: PlainColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Tints the row the page is currently showing. */
  isRowActive?: (row: T) => boolean;
  emptyMessage?: string;
}

const CELL_ALIGN = {
  left: 'tw-text-left',
  right: 'tw-text-right',
  center: 'tw-text-center',
} as const;

// The page's own table. Header and body cells are rendered from one column list, so a column's
// alignment is stated once and applied to both — a `<th>` defaults to centred and a `<td>` to
// inherited, and Tailwind's preflight is off (tailwind.config.js), so nothing resets that for us.
// A <colgroup> pins the widths so the two tables on this page don't reflow as content changes.
function PlainTable<T>({ columns, rows, getRowId, onRowClick, isRowActive, emptyMessage }: PlainTableProps<T>) {
  return (
    <div className="tw-overflow-x-auto">
      <table className="tw-w-full tw-table-fixed tw-border-separate tw-border-spacing-0 tw-text-sm">
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={[
                  'tw-border-b tw-border-hairline tw-bg-surface-muted tw-px-4 tw-py-2.5',
                  'tw-text-[0.6875rem] tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-ink-muted',
                  'dark:tw-border-hairline-dark dark:tw-bg-surface-dark-muted dark:tw-text-ink-dark-muted',
                  CELL_ALIGN[column.align ?? 'left'],
                ].join(' ')}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="tw-px-4 tw-py-10 tw-text-center tw-text-sm tw-text-ink-muted dark:tw-text-ink-dark-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const active = isRowActive?.(row) ?? false;
            const clickable = Boolean(onRowClick) && !active;
            return (
              <tr
                key={getRowId(row)}
                onClick={() => onRowClick?.(row)}
                className={[
                  'tw-transition-colors tw-duration-150',
                  active ? 'tw-bg-brand/[0.06] dark:tw-bg-brand-light/10' : '',
                  clickable ? 'tw-cursor-pointer hover:tw-bg-brand/[0.06] dark:hover:tw-bg-brand-light/10' : '',
                ].join(' ')}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      'tw-border-b tw-border-hairline tw-px-4 tw-py-2.5 dark:tw-border-hairline-dark',
                      CELL_ALIGN[column.align ?? 'left'],
                      column.numeric ? 'tw-tabular-nums' : '',
                      column.strong ? 'tw-font-semibold' : '',
                      column.muted
                        ? 'tw-text-ink-muted dark:tw-text-ink-dark-muted'
                        : 'tw-text-ink dark:tw-text-ink-dark',
                    ].join(' ')}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// A plain titled block. No icons, no tinted circles — the label is the only thing that needs to
// carry meaning here.
function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${CARD_SURFACE} tw-p-4`}>
      <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-2">
        <h2 className="tw-m-0 tw-text-sm tw-font-bold tw-uppercase tw-tracking-[0.06em] tw-text-ink-muted dark:tw-text-ink-dark-muted">
          {title}
        </h2>
        {action}
      </div>
      <dl className="tw-m-0 tw-flex tw-flex-col tw-gap-2">{children}</dl>
    </section>
  );
}

// Label left, value right — the values line up down the card instead of wrapping ragged.
function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-4">
      <dt className="tw-shrink-0 tw-text-sm tw-text-ink-muted dark:tw-text-ink-dark-muted">{label}</dt>
      <dd className="tw-m-0 tw-min-w-0 tw-break-words tw-text-right tw-text-sm tw-font-semibold tw-text-ink dark:tw-text-ink-dark">
        {value || <span className="tw-font-normal tw-text-ink-muted dark:tw-text-ink-dark-muted">—</span>}
      </dd>
    </div>
  );
}

function AmountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-py-0.5">
      <dt className="tw-text-sm tw-text-ink-muted dark:tw-text-ink-dark-muted">{label}</dt>
      <dd className="tw-m-0 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-ink dark:tw-text-ink-dark">{value}</dd>
    </div>
  );
}

interface ConfirmCopyEntry {
  title: string;
  message: (quotation: QuotationDetail) => string;
  confirmLabel?: string;
  danger?: boolean;
}

const CONFIRM_COPY: Record<PendingAction, ConfirmCopyEntry> = {
  send: {
    title: 'Send Quotation?',
    message: (quotation) => `Mark quotation "${quotation.quotationNumber}" as sent to the customer?`,
  },
  reject: {
    title: 'Reject Quotation?',
    message: (quotation) =>
      `Mark quotation "${quotation.quotationNumber}" as rejected? The linked enquiry will be marked as lost.`,
    danger: true,
  },
  approve: {
    title: 'Confirm Quotation?',
    message: (quotation) =>
      `Confirm quotation "${quotation.quotationNumber}" (v${quotation.version})? This moves the enquiry to Order Confirmed and raises the order. Other quotations stay available as history, and the enquiry's final budget becomes the total of everything confirmed.`,
    confirmLabel: 'Confirm',
  },
  convert: {
    title: 'Convert To Order?',
    message: (quotation) =>
      `Confirm the enquiry and create an order from quotation "${quotation.quotationNumber}" (v${quotation.version})? This marks the enquiry as Order Confirmed and cannot be undone.`,
    confirmLabel: 'Convert',
  },
  whatsapp: {
    title: 'Send on WhatsApp?',
    message: (quotation) =>
      `Open WhatsApp with a message about quotation "${quotation.quotationNumber}" for ${
        quotation.recipient.name ?? 'this customer'
      }?`,
    confirmLabel: 'Open WhatsApp',
  },
};
