import AddIcon from '@mui/icons-material/Add';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { FormDrawer } from '../../components/FormDrawer';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as rentService from '../../services/rentService';
import { useToast } from '../../store/ToastContext';
import type { RentalItem, RentalItemStatus } from '../../types/rent';
import { describeApiError } from '../../utils/apiError';
import { formatCurrency } from '../../utils/format';
import { rentalItemFormSchema, type RentalItemFormValues } from '../../validation/rentSchemas';

const EMPTY_FORM: RentalItemFormValues = {
  itemName: '',
  category: '',
  defaultRentRate: '',
  description: '',
  status: 'ACTIVE',
};

/**
 * The rentable catalogue — "md files/Stock/stock.md" §6.
 *
 * Phase 1 carries no physical stock counts (§6 "Important", §37): this master describes what can be
 * rented and at what default rate, not how much of it exists.
 */
export default function RentalItemListPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const canView = usePermission('RENT', 'canView');
  const canCreate = usePermission('RENT', 'canCreate');
  const canEdit = usePermission('RENT', 'canEdit');
  const canDelete = usePermission('RENT', 'canDelete');
  const canExport = usePermission('RENT', 'canExport');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<RentalItemStatus | ''>('');

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<RentalItem | null>(null);
  const [deleting, setDeleting] = useState<RentalItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['rent-items', { page, limit, search, category, status }],
    queryFn: () =>
      rentService.listItems({
        page,
        limit,
        search: search || undefined,
        category: category || undefined,
        status: status || undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  const { data: categories } = useQuery({
    queryKey: ['rent-item-categories'],
    queryFn: () => rentService.listItemCategories(),
    enabled: canView,
  });

  const form = useForm<RentalItemFormValues>({
    resolver: zodResolver(rentalItemFormSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        itemName: editing.itemName,
        category: editing.category ?? '',
        defaultRentRate: editing.defaultRentRate !== null ? String(Number(editing.defaultRentRate)) : '',
        description: editing.description ?? '',
        status: editing.status,
      });
    } else if (addOpen) {
      form.reset(EMPTY_FORM);
    }
  }, [editing, addOpen, form]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['rent-items'] });
    queryClient.invalidateQueries({ queryKey: ['rent-item-categories'] });
  }

  const saveMutation = useMutation({
    mutationFn: (values: RentalItemFormValues) => {
      const payload = {
        itemName: values.itemName.trim(),
        category: values.category || undefined,
        defaultRentRate: values.defaultRentRate ? Number(values.defaultRentRate) : undefined,
        description: values.description || undefined,
      };
      return editing
        ? rentService.updateItem(editing.id, { ...payload, status: values.status })
        : rentService.createItem(payload);
    },
    onSuccess: () => {
      invalidate();
      showToast(editing ? 'Rental item updated.' : 'Rental item created.');
      setEditing(null);
      setAddOpen(false);
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await saveMutation.mutateAsync(values);
    } catch (error) {
      setFormError(describeApiError(error, 'Unable to save the rental item. Please try again.'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => rentService.deleteItem(itemId),
    onSuccess: () => {
      invalidate();
      showToast('Rental item deleted.');
      setDeleting(null);
    },
    onError: (error) => setFormError(describeApiError(error, 'Unable to delete the rental item.')),
  });

  const columns: DataTableColumn<RentalItem>[] = [
    {
      key: 'itemName',
      header: 'Item',
      sortable: true,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.itemName}
          </Typography>
          {row.description && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.description}
            </Typography>
          )}
        </Stack>
      ),
      exportValue: (row) => row.itemName,
    },
    {
      key: 'category',
      header: 'Category',
      align: 'center',
      render: (row) => (row.category ? <Chip size="small" variant="outlined" label={row.category} /> : '—'),
      exportValue: (row) => row.category ?? '',
    },
    {
      key: 'defaultRentRate',
      header: 'Default Rate',
      align: 'right',
      render: (row) => (row.defaultRentRate !== null ? formatCurrency(row.defaultRentRate) : '—'),
      exportValue: (row) => row.defaultRentRate ?? '',
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: 110,
      render: (row) => <StatusBadge type="active" status={row.status} size="sm" />,
      exportValue: (row) => row.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: 100,
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          {canEdit && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  setFormError(null);
                  setEditing(row);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setFormError(null);
                  setDeleting(row);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view rental items.</Typography>;
  }

  const drawerOpen = addOpen || Boolean(editing);

  return (
    <Box>
      <PageHeader
        title="Rental Items"
        subtitle="What you rent out, and the rate it usually goes out at"
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Rent', to: '/rent' }, { label: 'Rental Items' }]}
        actions={
          canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setFormError(null);
                setAddOpen(true);
              }}
            >
              Add Rental Item
            </Button>
          )
        }
      />

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '16px' }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: 220, height: 40, display: 'flex', alignItems: 'center' }}>
            <SearchBar
              fullWidth
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by item name, category..."
            />
          </Box>
          <TextField
            select
            size="small"
            label="Category"
            sx={{ width: 190 }}
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {(categories ?? []).map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            sx={{ width: 160 }}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as RentalItemStatus | '');
              setPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      {formError && !drawerOpen && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

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
        onRefresh={() => refetch()}
        refreshing={isFetching}
        emptyState={{
          icon: <CategoryOutlinedIcon sx={{ fontSize: 36 }} />,
          title: 'No rental items yet',
          description: 'Add the chairs, tables, lights and props you rent out so stock outs can pick from them.',
          action: canCreate ? (
            <Button variant="contained" onClick={() => setAddOpen(true)}>
              Add Rental Item
            </Button>
          ) : undefined,
        }}
        exportFileName="rental-items"
        canExport={canExport}
      />

      <FormDrawer
        open={drawerOpen}
        title={editing ? 'Edit Rental Item' : 'Add Rental Item'}
        subtitle="Physical stock levels are not tracked in this phase."
        onClose={() => {
          setEditing(null);
          setAddOpen(false);
        }}
        onSave={onSubmit}
        saving={saveMutation.isPending}
      >
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <TextField
          label="Item Name"
          required
          fullWidth
          margin="normal"
          error={Boolean(form.formState.errors.itemName)}
          helperText={form.formState.errors.itemName?.message}
          {...form.register('itemName')}
        />
        <TextField
          label="Category"
          fullWidth
          margin="normal"
          placeholder="e.g. Seating, Lighting"
          {...form.register('category')}
        />
        <TextField
          label="Default Rent Rate"
          type="number"
          fullWidth
          margin="normal"
          helperText={
            form.formState.errors.defaultRentRate?.message ??
            'Pre-fills the rate when this item is added to a stock out. Still editable per transaction.'
          }
          error={Boolean(form.formState.errors.defaultRentRate)}
          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
          {...form.register('defaultRentRate')}
        />
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          multiline
          minRows={2}
          {...form.register('description')}
        />
        {/* Controller, not register: MUI's Select is not a native input, so a registered one keeps
            the previously shown option when the form is reset for a different record. */}
        {editing && (
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <TextField {...field} select label="Status" fullWidth margin="normal">
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </TextField>
            )}
          />
        )}
      </FormDrawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Rental Item?"
        message={`Delete "${deleting?.itemName}"? This cannot be undone.`}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
