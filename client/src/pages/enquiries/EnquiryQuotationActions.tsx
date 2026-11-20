import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Stack } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { IconButton } from '../../components/ui/IconButton';
import { usePermission } from '../../hooks/usePermission';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import type { ApiErrorResponse } from '../../types/api';
import type { QuotationListItem } from '../../types/quotation';
import { buildQuotationWhatsAppLink, canShareQuotation } from '../quotations/quotationActions';

// "md files/Enquiry/enq.md" §9 — the row actions the enquiry's quotation table must offer:
// View, Edit, Confirm, Duplicate, Download PDF, Send WhatsApp. Only permission gates them; no
// status may block Edit (§6/§7).
interface EnquiryQuotationActionsProps {
  row: QuotationListItem;
  /** Opens the read-only preview dialog — the enquiry page never navigates to the Quotation module. */
  onView: (id: number) => void;
  /** Opens the quotation dialog in edit mode, on this page. Also used for a freshly duplicated revision. */
  onEdit: (id: number) => void;
}

function errorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(error) && error.response) return error.response.data.message;
  return fallback;
}

export function EnquiryQuotationActions({ row, onView, onEdit }: EnquiryQuotationActionsProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const canEdit = usePermission('QUOTATIONS', 'canEdit');
  const canCreate = usePermission('QUOTATIONS', 'canCreate');
  const canPrint = usePermission('QUOTATIONS', 'canPrint');
  const canApprove = usePermission('QUOTATIONS', 'canApprove');
  const canDelete = usePermission('QUOTATIONS', 'canDelete');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['quotations'] });
    queryClient.invalidateQueries({ queryKey: ['enquiry'] });
    queryClient.invalidateQueries({ queryKey: ['enquiry-timeline'] });
    queryClient.invalidateQueries({ queryKey: ['enquiries'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['payment-tracker'] });
  }

  // Duplicate reads the full quotation (the list row carries no items) and posts it back as a new
  // one against the same enquiry. The server versions it as the next revision, so this is the
  // "start from the last one" path the doc's V1→V2→V3 example describes.
  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const source = await quotationService.getById(row.id);
      return quotationService.create({
        source: 'ENQUIRY',
        enquiryId: source.link.enquiry?.id,
        discount: Number(source.discount),
        cgstPercent: Number(source.cgstPercent),
        sgstPercent: Number(source.sgstPercent),
        advanceAmount: Number(source.advanceAmount ?? 0),
        remarks: source.remarks ?? undefined,
        // Every kind of line is copied: sections section by section, priced line items item by item (a
        // quotation may carry both).
        ...(source.sections.length > 0
          ? {
              sections: source.sections.map((section) => ({
                title: section.title ?? undefined,
                amount: Number(section.amount),
                items: section.items.map((item) => ({
                  description: item.description,
                  sizeQty: item.sizeQty ?? undefined,
                })),
              })),
            }
          : {}),
        ...(source.items.length > 0
          ? {
              items: source.items.map((item, index) => ({
                itemName: item.itemName,
                description: item.description ?? undefined,
                quantity: Number(item.quantity),
                unit: item.unit ?? undefined,
                rate: Number(item.rate),
                sortOrder: index,
              })),
            }
          : {}),
      });
    },
    onSuccess: (created) => {
      invalidate();
      showToast(`Quotation duplicated as v${created.version}.`, 'success');
      onEdit(created.id);
    },
    onError: (error) => showToast(errorMessage(error, 'Unable to duplicate this quotation.'), 'error'),
  });

  // Soft delete: the quotation drops out of the enquiry's table; its record is kept.
  const deleteMutation = useMutation({
    mutationFn: () => quotationService.remove(row.id),
    onSuccess: () => {
      invalidate();
      setConfirmingDelete(false);
      showToast('Quotation deleted.', 'success');
    },
    onError: (error) => {
      setConfirmingDelete(false);
      showToast(errorMessage(error, 'Unable to delete this quotation.'), 'error');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => quotationService.approve(row.id),
    onSuccess: () => {
      invalidate();
      showToast(`Quotation confirmed. The enquiry's status is unchanged — move it to Order Confirmed to raise the order.`, 'success');
    },
    onError: (error) => showToast(errorMessage(error, 'Unable to confirm this quotation.'), 'error'),
  });

  const downloadMutation = useMutation({
    mutationFn: () => quotationService.downloadPdf(row.id, `${row.quotationNumber}-v${row.version}.pdf`),
    onError: (error) => showToast(errorMessage(error, 'Unable to download the PDF.'), 'error'),
  });

  function handleWhatsApp() {
    const link = buildQuotationWhatsAppLink({
      quotationNumber: row.quotationNumber,
      recipientName: row.recipient.name,
      whatsapp: row.recipient.whatsapp,
      phone: row.recipient.phone,
    });
    if (!link) {
      showToast('No WhatsApp or phone number on record for this customer.', 'error');
      return;
    }
    window.open(link, '_blank', 'noopener');
  }

  // IconButton's `title` is both the tooltip and the accessible name, so no Tooltip wrapper.
  // The row itself is clickable, so the click is stopped here for the whole group: without it
  // every action would also fire the row handler and open the preview on top of what was asked for.
  return (
    <>
    <Stack
      direction="row"
      spacing={0.25}
      sx={{ justifyContent: 'flex-end' }}
      onClick={(event) => event.stopPropagation()}
    >
      <IconButton size="sm" title="View" onClick={() => onView(row.id)}>
        <VisibilityIcon fontSize="small" />
      </IconButton>

      {canEdit && (
        <IconButton size="sm" title="Edit" onClick={() => onEdit(row.id)}>
          <EditIcon fontSize="small" />
        </IconButton>
      )}

      {canApprove && row.status !== 'APPROVED' && (
        <IconButton size="sm" title="Confirm" disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
          <CheckCircleIcon fontSize="small" />
        </IconButton>
      )}

      {canCreate && (
        <IconButton
          size="sm"
          title="Duplicate as a new revision"
          disabled={duplicateMutation.isPending}
          onClick={() => duplicateMutation.mutate()}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      )}

      {canPrint && (
        <IconButton
          size="sm"
          title="Download PDF"
          disabled={downloadMutation.isPending}
          onClick={() => downloadMutation.mutate()}
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      )}

      {/* A superseded or declined quotation must not be re-sent to the customer as if it were the
          live document — the same rule the quotation view page and preview dialog apply. */}
      {canShareQuotation(row.status) && (
        <IconButton size="sm" title="Send on WhatsApp" onClick={handleWhatsApp}>
          <WhatsAppIcon fontSize="small" />
        </IconButton>
      )}

      {canDelete && (
        <IconButton size="sm" title="Delete" disabled={deleteMutation.isPending} onClick={() => setConfirmingDelete(true)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>

    {/* A dialog's clicks bubble through the React tree to the clickable table row, so they are stopped here too. */}
    <span onClick={(event) => event.stopPropagation()}>
    <ConfirmDialog
      open={confirmingDelete}
      title="Delete Quotation?"
      message={`Delete quotation "${row.quotationNumber}" (v${row.version})? It will no longer appear in the app, but its record is kept. A confirmed quotation, or one an order was raised from, cannot be deleted.`}
      confirmLabel="Delete"
      danger
      loading={deleteMutation.isPending}
      onConfirm={() => deleteMutation.mutate()}
      onClose={() => setConfirmingDelete(false)}
    />
    </span>
    </>
  );
}
