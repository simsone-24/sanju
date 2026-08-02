import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { FileUploader } from '../../../components/FileUploader';
import { FormDrawer } from '../../../components/FormDrawer';
import { usePermission } from '../../../hooks/usePermission';
import * as documentService from '../../../services/documentService';
import type { ApiErrorResponse } from '../../../types/api';
import type { OrderDetail } from '../../../types/order';
import { formatDate } from '../../../utils/format';
import { uploadDocumentSchema, type UploadDocumentFormValues } from '../../../validation/documentSchemas';

const DOCUMENT_TYPES = ['QUOTATION_PDF', 'RECEIPT', 'AGREEMENT', 'EVENT_PHOTO', 'OTHER'] as const;
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,application/pdf';

interface OrderDocumentsTabProps {
  order: OrderDetail;
}

export default function OrderDocumentsTab({ order }: OrderDocumentsTabProps) {
  const queryClient = useQueryClient();
  const canView = usePermission('ORDERS', 'canView');
  const canEdit = usePermission('ORDERS', 'canEdit');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const documentsQueryKey = ['order-documents', order.id];

  const { data: documents, isLoading } = useQuery({
    queryKey: documentsQueryKey,
    queryFn: () => documentService.listForOrder(order.id),
    enabled: canView,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadDocumentFormValues>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: { documentType: 'OTHER' },
  });

  const uploadMutation = useMutation({
    mutationFn: (values: UploadDocumentFormValues) => {
      if (!selectedFile) throw new Error('NO_FILE');
      return documentService.upload(order.id, { file: selectedFile, documentType: values.documentType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
      setUploadOpen(false);
      setSelectedFile(null);
      reset();
    },
  });

  const onUploadSubmit = handleSubmit(async (values) => {
    setFormError(null);
    if (!selectedFile) {
      setFileError('Please choose a file to upload.');
      return;
    }
    try {
      await uploadMutation.mutateAsync(values);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Unable to upload document. Please try again.');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
      setDeletingId(null);
    },
  });

  async function handleDownload(id: string, fileName: string) {
    setDownloadError(null);
    try {
      await documentService.downloadFile(id, fileName);
    } catch {
      setDownloadError('Unable to download this file. Please try again.');
    }
  }

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view documents.</Typography>;
  }

  if (isLoading) return <CircularProgress size={28} />;

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 1 }}>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUploadOpen(true)}>
            Upload Document
          </Button>
        )}
      </Stack>

      {downloadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDownloadError(null)}>
          {downloadError}
        </Alert>
      )}

      {!documents || documents.length === 0 ? (
        <Typography color="text.secondary">No documents uploaded yet.</Typography>
      ) : (
        <List>
          {documents.map((document) => (
            <ListItem
              key={document.id}
              divider
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Download">
                    <IconButton size="small" onClick={() => handleDownload(document.id, document.fileName)}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canEdit && (
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeletingId(document.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              }
            >
              <ListItemText
                primary={document.fileName}
                secondary={`${document.documentType.replaceAll('_', ' ')} • Uploaded ${formatDate(document.uploadedAt)}${
                  document.uploadedBy ? ` by ${document.uploadedBy.fullName}` : ''
                }`}
                sx={{ pr: 10 }}
              />
            </ListItem>
          ))}
        </List>
      )}

      <FormDrawer
        open={uploadOpen}
        title="Upload Document"
        onClose={() => setUploadOpen(false)}
        onSave={onUploadSubmit}
        saving={uploadMutation.isPending}
      >
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <TextField
          select
          label="Document Type"
          fullWidth
          margin="normal"
          error={Boolean(errors.documentType)}
          helperText={errors.documentType?.message}
          {...register('documentType')}
        >
          {DOCUMENT_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type.replaceAll('_', ' ')}
            </MenuItem>
          ))}
        </TextField>
        <FileUploader
          label="File"
          accept={ACCEPTED_TYPES}
          maxSizeBytes={MAX_DOCUMENT_SIZE_BYTES}
          file={selectedFile}
          onChange={(file) => {
            setSelectedFile(file);
            if (file) setFileError(null);
          }}
          error={fileError ?? undefined}
        />
      </FormDrawer>

      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Delete Document?"
        message="This document will be removed from the order. This cannot be undone."
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        onClose={() => setDeletingId(null)}
      />
    </>
  );
}
