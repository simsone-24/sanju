import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { ReactNode } from 'react';

interface FormDialogProps {
  open: boolean;
  title: string;
  /** Optional line under the title explaining what the form produces. */
  subtitle?: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  /** An alternative way to save the same form (e.g. "Save as Draft"), left of the primary button. */
  secondaryAction?: { label: string; onClick: () => void };
  maxWidth?: number;
  children: ReactNode;
}

// A centered popup alternative to FormDrawer — for a form that's quick, self-contained, and reads
// better as a focused dialog than a side panel taking over the edge of the screen. Same
// title/body/actions shape as FormDrawer (Save bottom-right, Cancel to its left, per
// docs/06_UI_UX_GUIDELINES.md §28) so the two are interchangeable at the call site.
export function FormDialog({
  open,
  title,
  subtitle,
  onClose,
  onSave,
  saving = false,
  saveLabel = 'Save',
  secondaryAction,
  maxWidth = 520,
  children,
}: FormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth={false}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: maxWidth }, borderRadius: fullScreen ? 0 : '16px' } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, pr: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ mt: 0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>{children}</DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        {secondaryAction && (
          <Button variant="outlined" onClick={secondaryAction.onClick} disabled={saving}>
            {secondaryAction.label}
          </Button>
        )}
        <Button variant="contained" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : saveLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
