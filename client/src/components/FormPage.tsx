import { Alert, Box, Button, Divider, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

interface FormPageProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  isDirty?: boolean;
  serverError?: string | null;
  // Content width cap for the standard single-column layout. Ignored when a sidePanel is provided.
  maxWidth?: number | string;
  // Optional right-hand panel (e.g. a live preview). When set, the page becomes a two-column layout
  // and the panel spans the full viewport height from the very top, beside the breadcrumb/header.
  sidePanel?: ReactNode;
  sidePanelWidth?: number;
  sidePanelMinWidth?: number;
  sidePanelMaxWidth?: number;
  // Remembers the user's dragged width across visits (e.g. "quotation-preview-width").
  // Omit to keep the resize session-only.
  sidePanelStorageKey?: string;
  // Extra controls rendered next to the title (e.g. a "Hide/Show Preview" toggle).
  headerActions?: ReactNode;
  children: ReactNode;
}

// Dedicated create/edit page shell — md files/UI-2.md "Form Navigation Guidelines": every
// module's Create/Edit action gets its own page (breadcrumb + header + centered, sectioned
// form) instead of opening inline inside the listing page.
export function FormPage({
  breadcrumbs,
  title,
  subtitle,
  onCancel,
  onSave,
  saving = false,
  saveLabel = 'Save',
  isDirty = false,
  serverError,
  maxWidth = 1100,
  sidePanel,
  sidePanelWidth = 500,
  sidePanelMinWidth = 360,
  sidePanelMaxWidth = 900,
  sidePanelStorageKey,
  headerActions,
  children,
}: FormPageProps) {
  const blocker = useUnsavedChangesGuard(isDirty && !saving);

  // Draggable divider for the side panel: width is seeded from localStorage (if a storage key is
  // given) so the user's chosen size survives a reload, then only ever adjusted via the handle.
  const [panelWidth, setPanelWidth] = useState(() => {
    if (sidePanelStorageKey) {
      const stored = Number(localStorage.getItem(sidePanelStorageKey));
      if (stored >= sidePanelMinWidth && stored <= sidePanelMaxWidth) return stored;
    }
    return sidePanelWidth;
  });
  const [resizing, setResizing] = useState(false);
  const dragStart = useRef<{ x: number; width: number } | null>(null);

  useEffect(() => {
    if (!resizing) return;

    // Lock the cursor to the whole page for the duration of the drag — otherwise it flickers to
    // whatever the pointer happens to be over (text caret on an input, pointer on a button) the
    // instant a fast mouse movement carries it off the narrow 16px handle.
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function onMouseMove(event: MouseEvent) {
      if (!dragStart.current) return;
      // Panel sits on the right, so dragging the handle left (negative delta) grows it.
      const delta = event.clientX - dragStart.current.x;
      const next = Math.min(sidePanelMaxWidth, Math.max(sidePanelMinWidth, dragStart.current.width - delta));
      setPanelWidth(next);
    }
    function onMouseUp() {
      setResizing(false);
      dragStart.current = null;
      setPanelWidth((current) => {
        if (sidePanelStorageKey) localStorage.setItem(sidePanelStorageKey, String(current));
        return current;
      });
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [resizing, sidePanelMinWidth, sidePanelMaxWidth, sidePanelStorageKey]);

  function handleResizeStart(event: ReactMouseEvent) {
    event.preventDefault();
    dragStart.current = { x: event.clientX, width: panelWidth };
    setResizing(true);
  }

  function handleResizeReset() {
    setPanelWidth(sidePanelWidth);
    if (sidePanelStorageKey) localStorage.removeItem(sidePanelStorageKey);
  }

  const header = (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <Stack
        direction="row"
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}
      >
        <Box>
          <Typography variant="h1">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {headerActions}
      </Stack>
    </>
  );

  const footer = (
    <Box sx={{ mt: 3, position: 'sticky', bottom: 0, zIndex: 1 }}>
      <Divider />
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ justifyContent: 'flex-end', py: 2, backgroundColor: 'background.default' }}
      >
        <Button onClick={onCancel} disabled={saving} size="large">
          Cancel
        </Button>
        <Button variant="contained" onClick={onSave} disabled={saving} size="large">
          {saving ? 'Saving…' : saveLabel}
        </Button>
      </Stack>
    </Box>
  );

  const confirmDialog = (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title="Unsaved Changes"
      message="You have unsaved changes. Are you sure you want to leave?"
      confirmLabel="Leave"
      cancelLabel="Stay"
      danger
      onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
      onClose={() => blocker.state === 'blocked' && blocker.reset()}
    />
  );

  // Two-column layout: the side panel starts at the top of the page (beside the breadcrumb/header)
  // and sticks full-height, so there's no empty space above it. A draggable handle sits between
  // the two columns so the panel's width isn't fixed — drag it to trade space with the form,
  // double-click it to reset back to the default width.
  if (sidePanel) {
    return (
      <>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: `minmax(0, 1fr) 16px ${panelWidth}px` },
            gap: 0,
            alignItems: 'start',
            ...(resizing && { cursor: 'col-resize' }),
          }}
        >
          <Box sx={{ minWidth: 0, pr: { xs: 0, md: 2 } }}>
            {header}
            {serverError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {serverError}
              </Alert>
            )}
            <Stack spacing={3}>{children}</Stack>
            {footer}
          </Box>

          <Box
            onMouseDown={handleResizeStart}
            onDoubleClick={handleResizeReset}
            title="Drag to resize · double-click to reset"
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              cursor: 'col-resize',
              position: 'sticky',
              top: 16,
              height: 'calc(100vh - 32px)',
              touchAction: 'none',
              '&:hover .resize-grip': { backgroundColor: 'primary.main', opacity: 1 },
            }}
          >
            <Box
              className="resize-grip"
              sx={{
                width: 4,
                borderRadius: 999,
                backgroundColor: resizing ? 'primary.main' : 'divider',
                opacity: resizing ? 1 : 0.7,
                transition: resizing ? 'none' : 'background-color 120ms ease, opacity 120ms ease',
              }}
            />
          </Box>

          <Box
            sx={{
              pl: { xs: 0, md: 2 },
              position: { md: 'sticky' },
              top: 16,
              height: { md: 'calc(100vh - 32px)' },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {sidePanel}
          </Box>
        </Box>
        {confirmDialog}
      </>
    );
  }

  return (
    <Box>
      {header}

      <Box sx={{ maxWidth, mx: 'auto' }}>
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Stack spacing={3}>{children}</Stack>
      </Box>

      <Box sx={{ maxWidth, mx: 'auto' }}>{footer}</Box>

      {confirmDialog}
    </Box>
  );
}
