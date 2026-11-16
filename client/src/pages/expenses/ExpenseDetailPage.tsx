import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditIcon from '@mui/icons-material/Edit';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { Alert, Box, Button, Divider, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DetailRow } from '../../components/DetailRow';
import { PageHeader } from '../../components/PageHeader';
import { usePermission } from '../../hooks/usePermission';
import { useRouteId } from '../../hooks/useRouteId';
import * as expenseService from '../../services/expenseService';
import { useToast } from '../../store/ToastContext';
import type { ExpenseReceipt } from '../../types/expense';
import { describeApiError } from '../../utils/apiError';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { ReceiptPreviewDialog } from './ReceiptPreviewDialog';

/** One expense in full — its details and every attached receipt. */
export default function ExpenseDetailPage() {
  const id = useRouteId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const canView = usePermission('EXPENSES', 'canView');
  const canEdit = usePermission('EXPENSES', 'canEdit');
  const canDelete = usePermission('EXPENSES', 'canDelete');

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => expenseService.getExpense(id),
    enabled: canView && Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showToast('Expense deleted.');
      navigate('/expenses', { replace: true });
    },
    onError: (error) => {
      setConfirmDelete(false);
      setActionError(describeApiError(error, 'Unable to delete the expense.'));
    },
  });

  async function handleDownload(receipt: ExpenseReceipt) {
    setActionError(null);
    try {
      await expenseService.downloadReceipt(id, receipt.id, receipt.fileName);
    } catch (error) {
      setActionError(describeApiError(error, 'Unable to download the receipt.'));
    }
  }

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view expenses.</Typography>;
  }
  if (isLoading) return <Typography color="text.secondary">Loading expense…</Typography>;
  if (!expense) return <Alert severity="error">Expense not found.</Alert>;

  return (
    <Box>
      <PageHeader
        title={expense.category.name}
        subtitle={`${formatCurrency(expense.amount)} · ${formatDate(expense.expenseDate)}`}
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Expenses', to: '/expenses' }, { label: 'Expense' }]}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/expenses')}>
              Back
            </Button>
            {canEdit && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  setActionError(null);
                  setEditOpen(true);
                }}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </Stack>
        }
      />

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 3fr) minmax(0, 2fr)' },
          alignItems: 'start',
        }}
      >
        <Paper variant="outlined" sx={{ borderRadius: '16px', p: 2.5 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Expense Details
          </Typography>
          <Stack spacing={1.75}>
            <DetailRow icon={<CategoryOutlinedIcon fontSize="small" />} label="Category" value={expense.category.name} />
            <DetailRow
              icon={<CalendarTodayOutlinedIcon fontSize="small" />}
              label="Expense Date"
              value={formatDate(expense.expenseDate)}
            />
            <DetailRow
              icon={<PaymentsOutlinedIcon fontSize="small" />}
              label="Amount"
              value={formatCurrency(expense.amount)}
            />
            <DetailRow
              icon={<PaymentsOutlinedIcon fontSize="small" />}
              label="Payment Method"
              value={expense.paymentMethod}
            />
            <DetailRow
              icon={<PersonOutlinedIcon fontSize="small" />}
              label="Paid To"
              value={expense.paidTo ?? '—'}
            />
            <DetailRow
              icon={<DescriptionOutlinedIcon fontSize="small" />}
              label="Description"
              value={
                expense.description ? (
                  <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {expense.description}
                  </Typography>
                ) : (
                  '—'
                )
              }
            />
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1.75}>
            <DetailRow
              icon={<PersonOutlinedIcon fontSize="small" />}
              label="Recorded By"
              value={expense.createdBy?.fullName ?? '—'}
            />
            <DetailRow
              icon={<CalendarTodayOutlinedIcon fontSize="small" />}
              label="Created On"
              value={formatDateTime(expense.createdAt)}
            />
            <DetailRow
              icon={<CalendarTodayOutlinedIcon fontSize="small" />}
              label="Last Updated"
              value={formatDateTime(expense.updatedAt)}
            />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: '16px', p: 2.5 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Receipts
          </Typography>
          {expense.receipts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No receipts attached.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {expense.receipts.map((receipt) => (
                <Stack
                  key={receipt.id}
                  direction="row"
                  spacing={1.25}
                  role="button"
                  tabIndex={0}
                  aria-label={`Preview ${receipt.fileName}`}
                  onClick={() => setPreviewId(receipt.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setPreviewId(receipt.id);
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'action.hover' },
                    alignItems: 'center',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: '10px',
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <InsertDriveFileOutlinedIcon fontSize="small" color="action" />
                  <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
                    {receipt.fileName}
                  </Typography>
                  <Tooltip title="Preview">
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewId(receipt.id);
                      }}
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDownload(receipt);
                      }}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      <ReceiptPreviewDialog
        expenseId={expense.id}
        receipts={expense.receipts}
        receiptId={previewId}
        onClose={() => setPreviewId(null)}
      />

      <ExpenseFormDialog open={editOpen} expense={expense} onClose={() => setEditOpen(false)} />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Expense?"
        message={`Delete the ${formatCurrency(expense.amount)} expense under "${expense.category.name}"? This cannot be undone.`}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => setConfirmDelete(false)}
      />
    </Box>
  );
}
