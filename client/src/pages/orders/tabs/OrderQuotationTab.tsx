import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../../components/StatusBadge';
import { usePermission } from '../../../hooks/usePermission';
import * as quotationService from '../../../services/quotationService';
import { useToast } from '../../../store/ToastContext';
import type { OrderDetail } from '../../../types/order';
import { formatCurrency, formatDate } from '../../../utils/format';
import { QuotationPreviewDialog } from '../../quotations/QuotationPreviewDialog';
import { isQuotationEditable } from '../../quotations/quotationStatusTransitions';

interface OrderQuotationTabProps {
  order: OrderDetail;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ fontWeight: 600, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

// "View Quotation" opens the full document in a modal (reusing the Quotations module's own
// QuotationPreviewDialog, which already renders the letterhead, items table, totals and bank
// details) so it's one click and never navigates away — "md files/order/view.md" §View Quotation.
//
// The quotation stays editable from here: extra work is routinely agreed late in the event, and
// since an order has no item list of its own the quotation's items are the only place to record it.
// Saving re-syncs this order's total and balance — see quotations/service.ts update(), whose
// EDITABLE_QUOTATION_STATUSES and CLOSED/CANCELLED order guard the button below mirrors.
export default function OrderQuotationTab({ order }: OrderQuotationTabProps) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const canPrint = usePermission('QUOTATIONS', 'canPrint');
  const canEditQuotation = usePermission('QUOTATIONS', 'canEdit');
  const [previewOpen, setPreviewOpen] = useState(false);

  const orderIsTerminal = order.status === 'CLOSED' || order.status === 'CANCELLED';
  // Split from the permission check so a view-only role isn't told the document is locked when it
  // is only their access that is limited.
  const editableByRule = isQuotationEditable(order.quotation.status) && !orderIsTerminal;
  const showEdit = canEditQuotation && editableByRule;

  let caption: string;
  if (orderIsTerminal) {
    caption = `Locked because this order is ${order.status === 'CLOSED' ? 'closed' : 'cancelled'}.`;
  } else if (!editableByRule) {
    caption = `Locked because the quotation is ${order.quotation.status.toLowerCase()}.`;
  } else if (showEdit) {
    caption = 'Editing this quotation updates the order total and balance.';
  } else {
    caption = 'You have view-only access to Quotations.';
  }

  async function handleDownload() {
    try {
      await quotationService.downloadPdf(
        order.quotation.id,
        `${order.quotation.quotationNumber}-v${order.quotation.version}.pdf`,
      );
    } catch {
      showToast('Unable to download the quotation PDF.', 'error');
    }
  }

  async function handlePrint() {
    try {
      await quotationService.openPdf(order.quotation.id);
    } catch {
      showToast('Unable to open the quotation PDF.', 'error');
    }
  }

  function handleWhatsApp() {
    const number = order.customer.mobile.replace(/\D/g, '');
    if (!number) {
      showToast('This customer has no mobile number on record.', 'error');
      return;
    }
    const message = `Hello ${order.customer.customerName}, please find your quotation ${order.quotation.quotationNumber}. Regards.`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }

  return (
    <>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '16px', maxWidth: 560 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(37, 99, 235, 0.12)',
              color: 'primary.main',
            }}
          >
            <ReceiptLongIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h4">Confirmed Quotation</Typography>
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={1.5}>
          <DetailRow
            label="Quotation No"
            value={`${order.quotation.quotationNumber} (v${order.quotation.version})`}
          />
          <DetailRow label="Status" value={<StatusBadge type="quotation" status={order.quotation.status} />} />
          <DetailRow label="Created" value={formatDate(order.quotation.quotationDate)} />
          <DetailRow label="Discount" value={formatCurrency(order.quotation.discount)} />
          <DetailRow
            label="Total"
            value={
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {formatCurrency(order.quotation.totalAmount)}
              </Typography>
            }
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', rowGap: 1 }}>
          <Button variant="contained" size="small" startIcon={<VisibilityIcon />} onClick={() => setPreviewOpen(true)}>
            View Quotation
          </Button>
          {showEdit && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/quotations/${order.quotation.id}/edit`)}
            >
              Edit Quotation
            </Button>
          )}
          {canPrint && (
            <>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => void handleDownload()}>
                Download PDF
              </Button>
              <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => void handlePrint()}>
                Print
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<WhatsAppIcon />}
            onClick={handleWhatsApp}
            sx={{ color: '#25D366', borderColor: '#25D366' }}
          >
            Share WhatsApp
          </Button>
        </Stack>
      </Paper>

      <QuotationPreviewDialog
        quotationId={previewOpen ? order.quotation.id : null}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
