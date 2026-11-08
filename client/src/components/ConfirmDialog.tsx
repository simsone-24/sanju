import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  /** An optional third button, rendered between Cancel and Confirm — e.g. the enquiry form's
   *  unsaved-changes prompt offering "Save Draft" alongside Stay/Leave. Omitted everywhere else. */
  extraAction?: { label: string; onClick: () => void; disabled?: boolean };
}

// Matches docs/06_UI_UX_GUIDELINES.md §14's "Delete Order? Yes/No" pattern.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
  extraAction,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        {extraAction && (
          <Button onClick={extraAction.onClick} variant="outlined" disabled={loading || extraAction.disabled}>
            {extraAction.label}
          </Button>
        )}
        <Button onClick={onConfirm} color={danger ? 'error' : 'primary'} variant="contained" disabled={loading}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
