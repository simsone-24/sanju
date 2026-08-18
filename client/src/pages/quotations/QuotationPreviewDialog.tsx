import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import * as quotationService from '../../services/quotationService';
import { useToast } from '../../store/ToastContext';
import { formatCurrency, formatDate, getPublicAssetUrl } from '../../utils/format';
import QuotationPreview from './QuotationPreview';
import { buildQuotationWhatsAppLink, canShareQuotation } from './quotationActions';

interface QuotationPreviewDialogProps {
  /** The quotation to preview; the dialog is open whenever this is non-null. */
  quotationId: number | null;
  onClose: () => void;
}

// Read-only preview of a saved quotation, opened from the "Preview" row action on the Quotations
// index page — reuses the same on-screen replica (QuotationPreview) shown live on the form page,
// so the two never drift out of sync.
export function QuotationPreviewDialog({ quotationId, onClose }: QuotationPreviewDialogProps) {
  const { showToast } = useToast();
  const open = Boolean(quotationId);

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['quotation', quotationId],
    queryFn: () => quotationService.getById(quotationId!),
    enabled: open,
  });

  const { data: branding } = useQuery({
    queryKey: ['quotation-branding'],
    queryFn: () => quotationService.getBranding(),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

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

  function handleWhatsApp() {
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

  const canShare = quotation ? canShareQuotation(quotation.status) : false;

  const subtotal = quotation ? Number(quotation.subtotal) : 0;
  const cgstPercent = quotation ? Number(quotation.cgstPercent) : 0;
  const sgstPercent = quotation ? Number(quotation.sgstPercent) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h4">
            {quotation ? `Quotation ${quotation.quotationNumber} (v${quotation.version})` : 'Quotation Preview'}
          </Typography>
          {quotation && (
            <Typography variant="body2" color="text.secondary">
              Total {formatCurrency(quotation.totalAmount)}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
        {isLoading || !quotation ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <QuotationPreview
            company={branding}
            recipient={quotation.recipient}
            quotationNumber={`${quotation.quotationNumber} (v${quotation.version})`}
            quotationDate={formatDate(quotation.quotationDate)}
            items={quotation.items.map((item) => ({
              itemName: item.itemName,
              quantity: Number(item.quantity),
              rate: Number(item.rate),
              amount: Number(item.amount),
            }))}
            subtotal={subtotal}
            cgstPercent={cgstPercent}
            sgstPercent={sgstPercent}
            cgstAmount={Math.round(((subtotal * cgstPercent) / 100) * 100) / 100}
            sgstAmount={Math.round(((subtotal * sgstPercent) / 100) * 100) / 100}
            total={Number(quotation.totalAmount)}
            images={quotation.images.map((image) => getPublicAssetUrl(image.filePath))}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} disabled={!quotation} onClick={handleDownload}>
            Download PDF
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} disabled={!quotation} onClick={handlePrint}>
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            disabled={!canShare}
            sx={{ color: '#25D366', borderColor: '#25D366' }}
            onClick={handleWhatsApp}
          >
            Send WhatsApp
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
