import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Alert, Box, Button, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { FormDrawer } from '../../../components/FormDrawer';
import { SearchBar } from '../../../components/SearchBar';
import { StatusBadge } from '../../../components/StatusBadge';
import { usePermission } from '../../../hooks/usePermission';
import * as eventTypeService from '../../../services/eventTypeService';
import type { ApiErrorResponse } from '../../../types/api';
import type { EventTypeDetail } from '../../../types/eventType';
import { eventTypeFormSchema, type EventTypeFormValues } from '../../../validation/eventTypeSchemas';

export default function EventTypesTab() {
  const queryClient = useQueryClient();
  const canView = usePermission('MASTERS', 'canView');
  const canCreate = usePermission('MASTERS', 'canCreate');
  const canEdit = usePermission('MASTERS', 'canEdit');
  const canDelete = usePermission('MASTERS', 'canDelete');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventTypeDetail | null>(null);
  const [deletingItem, setDeletingItem] = useState<EventTypeDetail | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['event-types', { page, limit, search }],
    queryFn: () => eventTypeService.list({ page, limit, search: search || undefined }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  function invalidateList() {
    queryClient.invalidateQueries({ queryKey: ['event-types'] });
  }

  const createForm = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeFormSchema),
    defaultValues: { eventName: '', colorCode: '', displayOrder: '', status: 'ACTIVE' },
  });

  const createMutation = useMutation({
    mutationFn: (values: EventTypeFormValues) =>
      eventTypeService.create({
        eventName: values.eventName,
        colorCode: values.colorCode || undefined,
        displayOrder: values.displayOrder ? Number(values.displayOrder) : undefined,
      }),
    onSuccess: () => {
      invalidateList();
      setAddOpen(false);
      createForm.reset();
    },
  });

  const onCreateSubmit = createForm.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createMutation.mutateAsync(values);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Unable to create event type. Please try again.');
      }
    }
  });

  const editForm = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeFormSchema),
    defaultValues: { eventName: '', colorCode: '', displayOrder: '', status: 'ACTIVE' },
  });

  useEffect(() => {
    if (editingItem) {
      editForm.reset({
        eventName: editingItem.eventName,
        colorCode: editingItem.colorCode ?? '',
        displayOrder: String(editingItem.displayOrder),
        status: editingItem.status,
      });
    }
  }, [editingItem, editForm]);

  const updateMutation = useMutation({
    mutationFn: (input: { id: number; values: EventTypeFormValues }) =>
      eventTypeService.update(input.id, {
        eventName: input.values.eventName,
        colorCode: input.values.colorCode || undefined,
        displayOrder: input.values.displayOrder ? Number(input.values.displayOrder) : undefined,
        status: input.values.status,
      }),
    onSuccess: () => {
      invalidateList();
      setEditingItem(null);
    },
  });

  const onEditSubmit = editForm.handleSubmit(async (values) => {
    if (!editingItem) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({ id: editingItem.id, values });
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Unable to update event type. Please try again.');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eventTypeService.remove(id),
    onSuccess: () => {
      invalidateList();
      setDeletingItem(null);
    },
  });

  const columns: DataTableColumn<EventTypeDetail>[] = [
    {
      key: 'eventName',
      header: 'Event Name',
      sortable: true,
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
          {row.colorCode && (
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: row.colorCode, flexShrink: 0 }} />
          )}
          <span>{row.eventName}</span>
        </Stack>
      ),
      exportValue: (row) => row.eventName,
    },
    { key: 'displayOrder', header: 'Display Order', align: 'center', exportValue: (row) => String(row.displayOrder) },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge type="active" status={row.status} size="sm" />,
      exportValue: (row) => row.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          {canEdit && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => setEditingItem(row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => setDeletingItem(row)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view event types.</Typography>;
  }

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <SearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by event name..."
        />
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Add Event Type
          </Button>
        )}
      </Stack>

      <DataTable
        columns={columns}
        rows={data?.records ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        meta={data?.meta}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage="No event types found."
        exportFileName="event-types"
      />

      <FormDrawer
        open={addOpen}
        title="Add Event Type"
        onClose={() => setAddOpen(false)}
        onSave={onCreateSubmit}
        saving={createMutation.isPending}
      >
        {formError && !editingItem && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <TextField
          label="Event Name"
          required
          fullWidth
          margin="normal"
          error={Boolean(createForm.formState.errors.eventName)}
          helperText={createForm.formState.errors.eventName?.message}
          {...createForm.register('eventName')}
        />
        <TextField
          label="Color Code"
          fullWidth
          margin="normal"
          placeholder="#1976d2"
          helperText="Used on the Calendar to color-code events of this type."
          {...createForm.register('colorCode')}
        />
        <TextField
          label="Display Order"
          type="number"
          fullWidth
          margin="normal"
          {...createForm.register('displayOrder')}
        />
      </FormDrawer>

      <FormDrawer
        open={Boolean(editingItem)}
        title="Edit Event Type"
        onClose={() => setEditingItem(null)}
        onSave={onEditSubmit}
        saving={updateMutation.isPending}
      >
        {formError && editingItem && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <TextField
          label="Event Name"
          required
          fullWidth
          margin="normal"
          error={Boolean(editForm.formState.errors.eventName)}
          helperText={editForm.formState.errors.eventName?.message}
          {...editForm.register('eventName')}
        />
        <TextField label="Color Code" fullWidth margin="normal" placeholder="#1976d2" {...editForm.register('colorCode')} />
        <TextField label="Display Order" type="number" fullWidth margin="normal" {...editForm.register('displayOrder')} />
        <TextField select label="Status" fullWidth margin="normal" {...editForm.register('status')}>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </TextField>
      </FormDrawer>

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Delete Event Type?"
        message={`Delete "${deletingItem?.eventName}"? This cannot be undone.`}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
        onClose={() => setDeletingItem(null)}
      />
    </>
  );
}
