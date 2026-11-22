import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { AuditLogEntry } from '../../types/auditLog';
import { formatDateTime } from '../../utils/format';
import { actionColor, actionLabel, moduleLabel, recordPath } from './auditLogLabels';

interface AuditLogDetailDialogProps {
  entry: AuditLogEntry | null;
  onClose: () => void;
  /** Opens the record the entry is about — only offered when that record has a page. */
  onOpenRecord: (path: string) => void;
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography component="div" variant="body2" sx={{ wordBreak: 'break-word' }}>
        {children}
      </Typography>
    </Box>
  );
}

/** Everything the log recorded for one entry, including the structured detail the table leaves out. */
export function AuditLogDetailDialog({ entry, onClose, onOpenRecord }: AuditLogDetailDialogProps) {
  const path = entry ? recordPath(entry.module, entry.referenceId) : null;
  const hasMetadata = entry?.metadata !== null && entry?.metadata !== undefined;

  return (
    <Dialog open={Boolean(entry)} onClose={onClose} maxWidth="sm" fullWidth>
      {entry && (
        <>
          <DialogTitle>Audit Entry #{entry.id}</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
              <Field label="When">{formatDateTime(entry.performedAt)}</Field>
              <Field label="User">
                {entry.performedBy ? `${entry.performedBy.fullName} (${entry.performedBy.username})` : 'System'}
              </Field>
              <Field label="Module">{moduleLabel(entry.module)}</Field>
              <Field label="Action">
                <Chip size="small" color={actionColor(entry.action)} label={actionLabel(entry.action)} />
              </Field>
              <Field label="Record">#{entry.referenceId}</Field>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Field label="Description">{entry.description || '—'}</Field>
            </Box>

            {hasMetadata && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                  Details
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: 1.5,
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 240,
                    fontSize: '0.8125rem',
                    bgcolor: 'action.hover',
                  }}
                >
                  {JSON.stringify(entry.metadata, null, 2)}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {path && (
              <Button onClick={() => onOpenRecord(path)}>Open {moduleLabel(entry.module).toLowerCase()} record</Button>
            )}
            <Button variant="contained" onClick={onClose}>
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
