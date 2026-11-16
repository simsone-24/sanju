import AddIcon from '@mui/icons-material/Add';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Alert, Box, Button, IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { FormDialog } from '../../components/FormDialog';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as expenseService from '../../services/expenseService';
import { useToast } from '../../store/ToastContext';
import type { ExpenseCategory, ExpenseCategoryStatus } from '../../types/expense';
import { describeApiError } from '../../utils/apiError';
import { expenseCategoryFormSchema, type ExpenseCategoryFormValues } from '../../validation/expenseSchemas';

const EMPTY_FORM: ExpenseCategoryFormValues = { name: '', status: 'ACTIVE' };

/** Expense category master — the list the expense form's Category dropdown reads. */
export default function ExpenseCategoryListPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const canView = usePermission('EXPENSES', 'canView');
  const canCreate = usePermission('EXPENSES', 'canCreate');
  const canEdit = usePermission('EXPENSES', 'canEdit');
  const canDelete = usePermission('EXPENSES', 'canDelete');
  const canExport = usePermission('EXPENSES', 'canExport');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ExpenseCategoryStatus | ''>('');

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [deleting, setDeleting] = useState<ExpenseCategory | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['expense-categories', { page, limit, search, status }],
    queryFn: () =>
      expenseService.listCategories({ page, limit, search: search || undefined, status: status || undefined }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  const form = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategoryFormSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (editing) {
      form.reset({ name: editing.name, status: editing.status });
    } else if (addOpen) {
      form.reset(EMPTY_FORM);
    }
  }, [editing, addOpen, form]);

  function closeDrawer() {
    setEditing(null);
    setAddOpen(false);
  }

  const saveMutation = useMutation({
    mutationFn: (values: ExpenseCategoryFormValues) =>
      editing
        ? expenseService.updateCategory(editing.id, { name: values.name, status: values.status })
        : expenseService.createCategory({ name: values.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      showToast(editing ? 'Category updated.' : 'Category created.');
      closeDrawer();
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await saveMutation.mutateAsync(values);
    } catch (error) {
      setFormError(describeApiError(error, 'Unable to save the category. Please try again.'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expenseService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      showToast('Category deleted.');
      setDeleting(null);
    },
    onError: (error) => {
      setDeleting(null);
      setFormError(describeApiError(error, 'Unable to delete the category.'));
    },
  });

  const columns: DataTableColumn<ExpenseCategory>[] = [
    {
      key: 'name',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.name}
        </Typography>
      ),
      exportValue: (row) => row.name,
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
      width: 110,
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          {canEdit && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
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
                onClick={(event) => {
                  event.stopPropagation();
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
    return <Typography color="text.secondary">You do not have access to view expense categories.</Typography>;
  }

  const drawerOpen = addOpen || Boolean(editing);

  return (
    <Box>
      <PageHeader
        title="Expense Categories"
        subtitle={`${data?.meta.totalRecords ?? 0} total records`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Expenses', to: '/expenses' },
          { label: 'Categories' },
        ]}
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
              Add Category
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
              placeholder="Search categories..."
            />
          </Box>
          <TextField
            select
            size="small"
            label="Status"
            sx={{ width: 170 }}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ExpenseCategoryStatus | '');
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
          title: 'No expense categories yet',
          description: 'Add categories such as Rent, Salaries or Utilities to classify your expenses.',
          action: canCreate ? (
            <Button variant="contained" onClick={() => setAddOpen(true)}>
              Add Category
            </Button>
          ) : undefined,
        }}
        exportFileName="expense-categories"
        canExport={canExport}
      />

      <FormDialog
        open={drawerOpen}
        title={editing ? 'Edit Category' : 'Add Category'}
        onClose={closeDrawer}
        onSave={onSubmit}
        saving={saveMutation.isPending}
      >
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <TextField
          label="Category Name"
          required
          fullWidth
          margin="normal"
          error={Boolean(form.formState.errors.name)}
          helperText={form.formState.errors.name?.message}
          {...form.register('name')}
        />
        {editing && (
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Status"
                fullWidth
                margin="normal"
                helperText="Inactive categories cannot be chosen for new expenses; existing expenses keep them."
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </TextField>
            )}
          />
        )}
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Category?"
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
