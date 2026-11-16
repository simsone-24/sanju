import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import * as expenseService from '../../services/expenseService';
import type { ExpenseReceipt } from '../../types/expense';
import { describeApiError } from '../../utils/apiError';

interface ReceiptPreviewDialogProps {
  expenseId: number;
  receipts: ExpenseReceipt[];
  /** The receipt to show first; null keeps the dialog closed. */
  receiptId: number | null;
  onClose: () => void;
}

interface LoadedReceipt {
  receiptId: number;
  url: string;
  isPdf: boolean;
}

/**
 * Shows a receipt in place — an image or a PDF — without saving it to disk. The file is fetched
 * through the authenticated API (a plain <img src> could not send the login token) and displayed
 * from a temporary object URL that is released when the receipt changes or the dialog closes.
 */
export function ReceiptPreviewDialog({ expenseId, receipts, receiptId, onClose }: ReceiptPreviewDialogProps) {
  const [currentId, setCurrentId] = useState<number | null>(receiptId);
  const [loaded, setLoaded] = useState<LoadedReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentId(receiptId);
  }, [receiptId]);

  const index = receipts.findIndex((item) => item.id === currentId);
  const receipt = index >= 0 ? receipts[index] : null;
  const receiptKey = receipt?.id;
  const receiptName = receipt?.fileName ?? '';

  useEffect(() => {
    if (receiptKey === undefined) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setLoaded(null);
    setError(null);

    expenseService
      .fetchReceiptBlob(expenseId, receiptKey)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({
          receiptId: receiptKey,
          url: objectUrl,
          isPdf: blob.type === 'application/pdf' || receiptName.toLowerCase().endsWith('.pdf'),
        });
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(describeApiError(caught, 'Unable to load the receipt.'));
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [expenseId, receiptKey, receiptName]);

  async function handleDownload() {
    if (!receipt) return;
    try {
      await expenseService.downloadReceipt(expenseId, receipt.id, receipt.fileName);
    } catch (caught) {
      setError(describeApiError(caught, 'Unable to download the receipt.'));
    }
  }

  const ready = loaded && loaded.receiptId === receiptKey ? loaded : null;

  return (
    <Dialog open={receiptId !== null && Boolean(receipt)} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h4" noWrap>
            {receipt?.fileName}
          </Typography>
          {receipts.length > 1 && (
            <Typography variant="caption" color="text.secondary">
              {index + 1} of {receipts.length}
            </Typography>
          )}
        </Box>
        {receipts.length > 1 && (
          <Stack direction="row">
            <Tooltip title="Previous">
              <span>
                <IconButton size="small" disabled={index <= 0} onClick={() => setCurrentId(receipts[index - 1].id)}>
                  <ChevronLeftIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Next">
              <span>
                <IconButton
                  size="small"
                  disabled={index >= receipts.length - 1}
                  onClick={() => setCurrentId(receipts[index + 1].id)}
                >
                  <ChevronRightIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}
        <Tooltip title="Download">
          <IconButton size="small" onClick={() => void handleDownload()}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, height: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        {!error && !ready && <CircularProgress />}
        {!error && ready && ready.isPdf && (
          <Box component="iframe" src={ready.url} title={receiptName} sx={{ width: '100%', height: '100%', border: 0 }} />
        )}
        {!error && ready && !ready.isPdf && (
          <Box
            component="img"
            src={ready.url}
            alt={receiptName}
            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
