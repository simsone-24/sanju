import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Alert,
  Avatar,
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
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { FormDrawer } from '../../components/FormDrawer';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as rentService from '../../services/rentService';
import { useToast } from '../../store/ToastContext';
import type { RentalPerson, RentalPersonStatus } from '../../types/rent';
import { describeApiError } from '../../utils/apiError';
import { formatCurrency } from '../../utils/format';
import { rentalPersonFormSchema, type RentalPersonFormValues } from '../../validation/rentSchemas';

const EMPTY_FORM: RentalPersonFormValues = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  notes: '',
  status: 'ACTIVE',
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

/** Rental Persons master — "md files/Stock/stock.md" §5, with the outstanding column from §24. */
export default function RentalPersonListPage() {
  const navigate = useNavigate();
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
  const [status, setStatus] = useState<RentalPersonStatus | ''>('');

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<RentalPerson | null>(null);
  const [deleting, setDeleting] = useState<RentalPerson | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['rent-persons', { page, limit, search, status }],
    queryFn: () =>
      rentService.listPersons({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  const form = useForm<RentalPersonFormValues>({
    resolver: zodResolver(rentalPersonFormSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        phone: editing.phone,
        email: editing.email ?? '',
        address: editing.address ?? '',
        city: editing.city ?? '',
        notes: editing.notes ?? '',
        status: editing.status,
      });
    } else if (addOpen) {
      form.reset(EMPTY_FORM);
    }
  }, [editing, addOpen, form]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['rent-persons'] });
    queryClient.invalidateQueries({ queryKey: ['rent-dashboard'] });
  }

  const saveMutation = useMutation({
    mutationFn: (values: RentalPersonFormValues) => {
      const payload = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email || undefined,
        address: values.address || undefined,
        city: values.city || undefined,
        notes: values.notes || undefined,
      };
      return editing
        ? rentService.updatePerson(editing.id, { ...payload, status: values.status })
        : rentService.createPerson(payload);
    },
    onSuccess: () => {
      invalidate();
      showToast(editing ? 'Rental person updated.' : 'Rental person created.');
      setEditing(null);
      setAddOpen(false);
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await saveMutation.mutateAsync(values);
    } catch (error) {
      setFormError(describeApiError(error, 'Unable to save the rental person. Please try again.'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (personId: string) => rentService.deletePerson(personId),
    onSuccess: () => {
      invalidate();
      showToast('Rental person deleted.');
      setDeleting(null);
    },
    onError: (error) => setFormError(describeApiError(error, 'Unable to delete the rental person.')),
  });

  const columns: DataTableColumn<RentalPerson>[] = [
    {
      key: 'name',
      header: 'Rental Person',
      sortable: true,
      render: (row) => (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 34, height: 34, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
            {initialsOf(row.name)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {row.phone}
            </Typography>
          </Box>
        </Stack>
      ),
      exportValue: (row) => row.name,
    },
    {
      key: 'city',
      header: 'City',
      align: 'center',
      render: (row) => row.city ?? '—',
      exportValue: (row) => row.city ?? '',
    },
    {
      key: 'stockOutCount',
      header: 'Stock Outs',
      align: 'center',
      width: 120,
      render: (row) => (
        <Chip size="small" label={row.stockOutCount} sx={{ fontWeight: 700, bgcolor: 'action.selected' }} />
      ),
      exportValue: (row) => String(row.stockOutCount),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      align: 'right',
      render: (row) => formatCurrency(row.totalAmount),
      exportValue: (row) => String(row.totalAmount),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      render: (row) => formatCurrency(row.paidAmount),
      exportValue: (row) => String(row.paidAmount),
    },
    {
      key: 'pendingAmount',
      header: 'Pending',
      align: 'right',
      render: (row) =>
        row.pendingAmount > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>
            {formatCurrency(row.pendingAmount)}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
            Settled
          </Typography>
        ),
      exportValue: (row) => String(row.pendingAmount),
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
      width: 130,
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/rent/persons/${row.id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
            <Tooltip title={row.stockOutCount > 0 ? 'Has transactions — mark inactive instead' : 'Delete'}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={row.stockOutCount > 0}
                  onClick={(event) => {
                    event.stopPropagation();
                    setFormError(null);
                    setDeleting(row);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view rental persons.</Typography>;
  }

  const drawerOpen = addOpen || Boolean(editing);

  return (
    <Box>
      <PageHeader
        title="Rental Persons"
        subtitle={`${data?.meta.totalRecords ?? 0} total records`}
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Rent', to: '/rent' }, { label: 'Rental Persons' }]}
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
              Add Rental Person
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
              placeholder="Search by name, phone, email, city..."
            />
          </Box>
          <TextField
            select
            size="small"
            label="Status"
            sx={{ width: 170 }}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as RentalPersonStatus | '');
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
        onRowClick={(row) => navigate(`/rent/persons/${row.id}`)}
        onRefresh={() => refetch()}
        refreshing={isFetching}
        emptyState={{
          icon: <GroupsOutlinedIcon sx={{ fontSize: 36 }} />,
          title: 'No rental persons yet',
          description: 'Add the people you rent stock to — every stock out is raised against one of them.',
          action: canCreate ? (
            <Button variant="contained" onClick={() => setAddOpen(true)}>
              Add Rental Person
            </Button>
          ) : undefined,
        }}
        exportFileName="rental-persons"
        canExport={canExport}
      />

      <FormDrawer
        open={drawerOpen}
        title={editing ? 'Edit Rental Person' : 'Add Rental Person'}
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
          label="Name"
          required
          fullWidth
          margin="normal"
          error={Boolean(form.formState.errors.name)}
          helperText={form.formState.errors.name?.message}
          {...form.register('name')}
        />
        <TextField
          label="Phone"
          required
          fullWidth
          margin="normal"
          error={Boolean(form.formState.errors.phone)}
          helperText={form.formState.errors.phone?.message}
          {...form.register('phone')}
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          error={Boolean(form.formState.errors.email)}
          helperText={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        <TextField label="City" fullWidth margin="normal" {...form.register('city')} />
        <TextField label="Address" fullWidth margin="normal" multiline minRows={2} {...form.register('address')} />
        <TextField label="Notes" fullWidth margin="normal" multiline minRows={2} {...form.register('notes')} />
        {/* Controller, not register: MUI's Select is not a native input, so a registered one keeps
            the previously shown option when the form is reset for a different record. */}
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
                helperText="Inactive persons cannot be selected for new stock outs, but their history stays available."
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </TextField>
            )}
          />
        )}
      </FormDrawer>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Rental Person?"
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
