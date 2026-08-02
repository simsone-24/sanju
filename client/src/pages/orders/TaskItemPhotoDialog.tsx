import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FileUploader } from '../../components/FileUploader';
import * as taskPlanService from '../../services/taskPlanService';
import { useToast } from '../../store/ToastContext';
import type { TaskItemDetail } from '../../types/taskPlan';
import { describeApiError } from '../../utils/apiError';

// Mirrors createImageUploader('task-photos', 5MB) in server/src/modules/task-plan/routes.ts.
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

interface TaskItemPhotoDialogProps {
  item: TaskItemDetail | null;
  canEdit: boolean;
  taskPlanQueryKey: readonly unknown[];
  onClose: () => void;
}

/**
 * View / replace / remove a task's optional completion photo (scope.md §Completion Photo).
 * The photo lives behind an authenticated endpoint, so it is fetched as a blob and shown from a
 * short-lived object URL rather than a direct <img src>.
 */
export function TaskItemPhotoDialog({ item, canEdit, taskPlanQueryKey, onClose }: TaskItemPhotoDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemId = item?.id ?? null;
  const hasPhoto = item?.hasPhoto ?? false;

  useEffect(() => {
    if (!itemId || !hasPhoto) {
      setPhotoUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    setLoadingPhoto(true);

    taskPlanService
      .getPhotoObjectUrl(itemId)
      .then((url) => {
        objectUrl = url;
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setPhotoUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load the completion photo.');
      })
      .finally(() => {
        if (!cancelled) setLoadingPhoto(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [itemId, hasPhoto]);

  function handleClose() {
    setSelectedFile(null);
    setError(null);
    onClose();
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: taskPlanQueryKey });
  }

  const uploadMutation = useMutation({
    mutationFn: (file: File) => taskPlanService.uploadPhoto(itemId!, file),
    onSuccess: () => {
      invalidate();
      showToast('Completion photo uploaded.');
      handleClose();
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => taskPlanService.removePhoto(itemId!),
    onSuccess: () => {
      invalidate();
      showToast('Completion photo removed.');
      handleClose();
    },
  });

  async function handleUpload() {
    if (!selectedFile) {
      setError('Please choose a photo to upload.');
      return;
    }
    setError(null);
    try {
      await uploadMutation.mutateAsync(selectedFile);
    } catch (caught) {
      setError(describeApiError(caught, 'Unable to upload the photo. Please try again.'));
    }
  }

  async function handleRemove() {
    setError(null);
    try {
      await removeMutation.mutateAsync();
    } catch (caught) {
      setError(describeApiError(caught, 'Unable to remove the photo. Please try again.'));
    }
  }

  const busy = uploadMutation.isPending || removeMutation.isPending;

  return (
    <Dialog open={Boolean(item)} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Completion Photo</DialogTitle>
      <DialogContent>
        {item && (
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {item.taskName}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loadingPhoto && <CircularProgress size={24} />}

        {photoUrl && (
          <Box
            component="img"
            src={photoUrl}
            alt="Task completion"
            sx={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: '12px', mb: 2 }}
          />
        )}

        {!loadingPhoto && !photoUrl && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No completion photo has been uploaded for this task.
          </Typography>
        )}

        {canEdit && (
          <FileUploader
            label={hasPhoto ? 'Replace Photo' : 'Upload Photo (optional)'}
            accept={ACCEPTED_TYPES}
            maxSizeBytes={MAX_PHOTO_SIZE_BYTES}
            file={selectedFile}
            onChange={(file) => {
              setSelectedFile(file);
              if (file) setError(null);
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        {canEdit && hasPhoto && (
          <Button color="error" onClick={() => void handleRemove()} disabled={busy}>
            Remove Photo
          </Button>
        )}
        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
          <Button onClick={handleClose} disabled={busy}>
            Close
          </Button>
          {canEdit && (
            <Button variant="contained" onClick={() => void handleUpload()} disabled={busy || !selectedFile}>
              {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
