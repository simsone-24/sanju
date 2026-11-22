import { Alert, Stack } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { describeApiError } from '../utils/apiError';

interface UseConfirmedActionOptions<T> {
  title: string;
  /** What the person is about to do and what goes with it — shown above Cancel / the confirm button. */
  message: (item: T) => ReactNode;
  /** The call to the server. */
  action: (item: T) => Promise<void>;
  /** Query-key prefixes to refresh once the delete has gone through. */
  invalidate: readonly (readonly unknown[])[];
  fallbackError: string;
  /** The confirm button's text. Defaults to Delete — the case this was written for. */
  confirmLabel?: string;
  /** Draws the confirm button as a warning (red). On by default; turn off for a safe action like Restore. */
  danger?: boolean;
  /** Runs after the cache refresh — e.g. leaving the page of a record that is no longer there. */
  onDone?: (item: T) => void;
}

/**
 * The confirm → act → refresh sequence every soft delete (and restore) in the app needs, once: ask
 * first, send it, show the server's own message if it is refused, and refresh every view that could
 * be showing the record or the figures it fed.
 *
 * Returns `request` to open the confirmation for an item, and the `dialog` to render once.
 */
export function useConfirmedAction<T>({
  title,
  message,
  action,
  invalidate,
  fallbackError,
  confirmLabel = 'Delete',
  danger = true,
  onDone,
}: UseConfirmedActionOptions<T>) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (item: T) => action(item),
    onSuccess: (_result, item) => {
      for (const queryKey of invalidate) void queryClient.invalidateQueries({ queryKey: [...queryKey] });
      setTarget(null);
      onDone?.(item);
    },
    onError: (caught) => setError(describeApiError(caught, fallbackError)),
  });

  function request(item: T) {
    setError(null);
    setTarget(item);
  }

  function close() {
    if (!mutation.isPending) setTarget(null);
  }

  const dialog = (
    <ConfirmDialog
      open={target !== null}
      title={title}
      message={
        target !== null && (
          <Stack spacing={1.5}>
            <span>{message(target)}</span>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )
      }
      confirmLabel={confirmLabel}
      cancelLabel="Cancel"
      danger={danger}
      loading={mutation.isPending}
      onConfirm={() => target !== null && mutation.mutate(target)}
      onClose={close}
    />
  );

  return { request, dialog };
}
