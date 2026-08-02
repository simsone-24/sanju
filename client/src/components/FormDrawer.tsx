import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface FormDrawerProps {
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
  width?: number;
  children: ReactNode;
}

// docs/06_UI_UX_GUIDELINES.md §19: Masters and similar create/edit forms prefer a drawer over a
// full page. §28 UX Guidelines: Save always bottom-right, Cancel to its left.
export function FormDrawer({
  open,
  title,
  subtitle,
  onClose,
  onSave,
  saving = false,
  saveLabel = 'Save',
  secondaryAction,
  width = 480,
  children,
}: FormDrawerProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: width }, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', px: 3, py: 2.25 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Divider />

        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>{children}</Box>

        <Divider />
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ justifyContent: 'flex-end', alignItems: 'center', px: 3, py: 2, flexWrap: 'wrap', rowGap: 1 }}
        >
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
        </Stack>
      </Box>
    </Drawer>
  );
}
