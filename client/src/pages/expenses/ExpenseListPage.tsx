import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Alert, Box, Button, IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { CUSTOM_DATE_RANGE, DateRangeFilter, type DateRangeValue } from '../../components/DateRangeFilter';
import { IsoDatePickerField } from '../../components/DatePickerField';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { usePermission } from '../../hooks/usePermission';
import * as expenseService from '../../services/expenseService';
import { useToast } from '../../store/ToastContext';
import type { Expense } from '../../types/expense';
import type { PaymentMethodType } from '../../types/payment';
import { describeApiError } from '../../utils/apiError';
import { dateRangeParams, TRANSACTION_DATE_PRESETS } from '../../utils/dateRange';
import { formatCurrency, formatDate } from '../../utils/format';
import { EXPENSE_PAYMENT_METHODS } from '../../validation/expenseSchemas';
import { ExpenseFormDialog } from './ExpenseFormDialog';

/** Expense ledger — general business expenses. A row opens the expense's view page. */
export default function ExpenseListPage() {
  const navigate = useNavigate();
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
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | ''>('');
  const [dateRange, setDateRange] = useState<DateRangeValue>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const preset = dateRange && dateRange !== CUSTOM_DATE_RANGE ? dateRange : null;
  const presetBounds = preset ? dateRangeParams(preset) : null;
  const effectiveFrom = presetBounds ? presetBounds.from : dateFrom;
  const effectiveTo = presetBounds ? (presetBounds.to ?? '') : dateTo;

  function applyDateRange(value: DateRangeValue) {
    setDateRange(value);
    if (value !== CUSTOM_DATE_RANGE) {
      setDateFrom('');
      setDateTo('');
    }
    setPage(1);
  }

  // Typing in either field is what "Custom Range" means; the bound the user did not touch is
  // carried over from what is on screen so leaving a named window narrows rather than clears it.
  function applyCustomBound(patch: { from?: string; to?: string }) {
    setDateFrom(patch.from !== undefined ? patch.from : effectiveFrom);
    setDateTo(patch.to !== undefined ? patch.to : effectiveTo);
    setDateRange(CUSTOM_DATE_RANGE);
    setPage(1);
  }

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['expenses', { page, limit, search, categoryId, paymentMethod, effectiveFrom, effectiveTo }],
    queryFn: () =>
      expenseService.listExpenses({
        page,
        limit,
        search: search || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        paymentMethod: paymentMethod || undefined,
        dateFrom: effectiveFrom || undefined,
        dateTo: effectiveTo || undefined,
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  const { data: categories } = useQuery({
    queryKey: ['expense-categories', 'options'],
    queryFn: () => expenseService.listCategories({ page: 1, limit: 100 }),
    enabled: canView,
  });
  const allCategories = categories?.records ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showToast('Expense deleted.');
      setDeleting(null);
    },
    onError: (error) => {
      setDeleting(null);
      setActionError(describeApiError(error, 'Unable to delete the expense.'));
    },
  });

  const columns: DataTableColumn<Expense>[] = [
    {
      key: 'expenseDate',
      header: 'Date',
      sortable: true,
      width: 130,
      render: (row) => formatDate(row.expenseDate),
      exportValue: (row) => row.expenseDate,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {row.category.name}
        </Typography>
      ),
      exportValue: (row) => row.category.name,
    },
    {
      key: 'paidTo',
      header: 'Paid To',
      sortable: true,
      render: (row) => row.paidTo ?? '—',
      exportValue: (row) => row.paidTo ?? '',
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      align: 'center',
      width: 110,
      render: (row) => row.paymentMethod,
      exportValue: (row) => row.paymentMethod,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {formatCurrency(row.amount)}
        </Typography>
      ),
      exportValue: (row) => String(row.amount),
    },
    {
      key: 'description',
      header: 'Description',
      hideByDefault: true,
      render: (row) => row.description ?? '—',
      exportValue: (row) => row.description ?? '',
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: 140,
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/expenses/${row.id}`);
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
                  setActionError(null);
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
                  setActionError(null);
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
    return <Typography color="text.secondary">You do not have access to view expenses.</Typography>;
  }

  return (
    <Box>
      <PageHeader
        title="Expenses"
        subtitle={`${data?.meta.totalRecords ?? 0} total records`}
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Expenses' }]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/expenses/categories')}>
              Categories
            </Button>
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setActionError(null);
                  setAddOpen(true);
                }}
              >
                Add Expense
              </Button>
            )}
          </Stack>
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
              placeholder="Search by category, paid to, description..."
            />
          </Box>
          <TextField
            select
            size="small"
            label="Category"
            sx={{ width: 190 }}
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {allCategories.map((category) => (
              <MenuItem key={category.id} value={String(category.id)}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Method"
            sx={{ width: 150 }}
            value={paymentMethod}
            onChange={(event) => {
              setPaymentMethod(event.target.value as PaymentMethodType | '');
              setPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {EXPENSE_PAYMENT_METHODS.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>
          <DateRangeFilter
            variant="floating"
            presets={TRANSACTION_DATE_PRESETS}
            sx={{ width: 180 }}
            value={dateRange}
            onChange={applyDateRange}
            custom
          />
          <Box sx={{ width: 160 }}>
            <IsoDatePickerField
              label="From"
              margin="none"
              value={effectiveFrom}
              onChange={(value) => applyCustomBound({ from: value })}
            />
          </Box>
          <Box sx={{ width: 160 }}>
            <IsoDatePickerField
              label="To"
              margin="none"
              value={effectiveTo}
              onChange={(value) => applyCustomBound({ to: value })}
            />
          </Box>
        </Stack>
      </Paper>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
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
        onRowClick={(row) => navigate(`/expenses/${row.id}`)}
        onRefresh={() => refetch()}
        refreshing={isFetching}
        emptyState={{
          icon: <ReceiptLongIcon sx={{ fontSize: 36 }} />,
          title: 'No expenses found',
          description: 'Record business expenses here. Add an expense category first if you have none.',
          action: canCreate ? (
            <Button variant="contained" onClick={() => setAddOpen(true)}>
              Add Expense
            </Button>
          ) : undefined,
        }}
        exportFileName="expenses"
        canExport={canExport}
      />

      <ExpenseFormDialog
        open={addOpen || Boolean(editing)}
        expense={editing}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete Expense?"
        message={
          deleting
            ? `Delete the ${formatCurrency(deleting.amount)} expense under "${deleting.category.name}"? This cannot be undone.`
            : ''
        }
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Box>
  );
}
