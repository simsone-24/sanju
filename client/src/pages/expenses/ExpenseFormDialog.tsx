import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Autocomplete, Box, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { IsoDatePickerField } from '../../components/DatePickerField';
import { FormDialog } from '../../components/FormDialog';
import { MultiFileUploader } from '../../components/MultiFileUploader';
import { ReceiptPreviewDialog } from './ReceiptPreviewDialog';
import * as expenseService from '../../services/expenseService';
import { useToast } from '../../store/ToastContext';
import type { Expense } from '../../types/expense';
import { describeApiError } from '../../utils/apiError';
import {
  EXPENSE_PAYMENT_METHODS,
  expenseFormSchema,
  type ExpenseFormValues,
} from '../../validation/expenseSchemas';

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_RECEIPTS = 10;
const RECEIPT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

function emptyForm(): ExpenseFormValues {
  return {
    categoryName: '',
    expenseDate: dayjs().format('YYYY-MM-DD'),
    amount: '',
    paymentMethod: 'CASH',
    paidTo: '',
    description: '',
  };
}

interface ExpenseFormDialogProps {
  open: boolean;
  /** The expense being edited, or null to add a new one. */
  expense: Expense | null;
  onClose: () => void;
}

/** Add / edit popup shared by the expense list and the expense view page. */
export function ExpenseFormDialog({ open, expense, onClose }: ExpenseFormDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [receipts, setReceipts] = useState<File[]>([]);
  // Existing receipts the user has detached in the open form; applied when it is saved.
  const [removedReceiptIds, setRemovedReceiptIds] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['expense-categories', 'options'],
    queryFn: () => expenseService.listCategories({ page: 1, limit: 100 }),
    enabled: open,
  });

  const allCategories = categories?.records ?? [];
  // Only active categories are offered, plus the one the expense being edited already has.
  const formCategories = allCategories.filter(
    (category) => category.status === 'ACTIVE' || category.id === expense?.category.id,
  );

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: emptyForm(),
  });

  useEffect(() => {
    if (!open) return;
    setReceipts([]);
    setRemovedReceiptIds([]);
    setFormError(null);
    form.reset(
      expense
        ? {
            categoryName: expense.category.name,
            expenseDate: expense.expenseDate,
            amount: String(expense.amount),
            paymentMethod: expense.paymentMethod,
            paidTo: expense.paidTo ?? '',
            description: expense.description ?? '',
          }
        : emptyForm(),
    );
  }, [open, expense, form]);

  const saveMutation = useMutation({
    mutationFn: (values: ExpenseFormValues) => {
      const input = {
        categoryName: values.categoryName,
        expenseDate: values.expenseDate,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
        paidTo: values.paidTo,
        description: values.description,
      };
      return expense
        ? expenseService.updateExpense(expense.id, input, receipts, removedReceiptIds)
        : expenseService.createExpense(input, receipts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense'] });
      // The form can create a category, so the master and every dropdown fed by it are stale.
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      showToast(expense ? 'Expense updated.' : 'Expense created.');
      onClose();
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await saveMutation.mutateAsync(values);
    } catch (error) {
      setFormError(describeApiError(error, 'Unable to save the expense. Please try again.'));
    }
  });

  const errors = form.formState.errors;
  const keptReceipts = (expense?.receipts ?? []).filter((item) => !removedReceiptIds.includes(item.id));

  return (
    <FormDialog
      open={open}
      title={expense ? 'Edit Expense' : 'Add Expense'}
      onClose={onClose}
      maxWidth={720}
      onSave={onSubmit}
      saving={saveMutation.isPending}
    >
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}
      {/* Controller, not register: the category and date fields are not native inputs, so a
          registered one keeps the previously shown value when the form is reset for another record. */}
      {/* Two fields per row; stacks to one column on a phone. */}
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          mt: 1,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          alignItems: 'start',
        }}
      >
        <Controller
          name="categoryName"
          control={form.control}
          render={({ field }) => {
            const typed = field.value.trim().toLowerCase();
            const isNew = typed !== '' && !allCategories.some((category) => category.name.toLowerCase() === typed);
            return (
              <Autocomplete
                freeSolo
                options={formCategories.map((category) => category.name)}
                inputValue={field.value}
                onInputChange={(_event, value) => field.onChange(value)}
                value={field.value}
                onChange={(_event, value) => field.onChange(value ?? '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    required
                    margin="none"
                    error={Boolean(errors.categoryName)}
                    helperText={
                      errors.categoryName?.message ??
                      (isNew
                        ? `"${field.value.trim()}" is new and will be added to the category master.`
                        : 'Pick a category, or type a new one to add it.')
                    }
                  />
                )}
              />
            );
          }}
        />
        <Controller
          name="expenseDate"
          control={form.control}
          render={({ field }) => (
            <IsoDatePickerField
              label="Expense Date"
              margin="none"
              required
              value={field.value}
              onChange={field.onChange}
              error={Boolean(errors.expenseDate)}
              helperText={errors.expenseDate?.message}
            />
          )}
        />
        <TextField
          label="Amount"
          required
          fullWidth
          margin="none"
          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
          error={Boolean(errors.amount)}
          helperText={errors.amount?.message}
          {...form.register('amount')}
        />
        <Controller
          name="paymentMethod"
          control={form.control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Payment Method"
              required
              fullWidth
              margin="none"
              error={Boolean(errors.paymentMethod)}
              helperText={errors.paymentMethod?.message}
            >
              {EXPENSE_PAYMENT_METHODS.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <TextField
          label="Paid To"
          fullWidth
          margin="none"
          error={Boolean(errors.paidTo)}
          helperText={errors.paidTo?.message}
          {...form.register('paidTo')}
        />
        <TextField
          label="Description"
          fullWidth
          margin="none"
          multiline
          minRows={2}
          error={Boolean(errors.description)}
          helperText={errors.description?.message}
          {...form.register('description')}
        />
      </Box>
      <Box sx={{ mt: 1.5 }}>
        {keptReceipts.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500, color: 'text.secondary' }}>
              Attached receipts
            </Typography>
            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
              {keptReceipts.map((item) => (
                <Chip
                  key={item.id}
                  label={item.fileName}
                  onClick={() => setPreviewId(item.id)}
                  onDelete={() => setRemovedReceiptIds((ids) => [...ids, item.id])}
                />
              ))}
            </Stack>
          </Box>
        )}
        <MultiFileUploader
          label={`Receipts — images or PDFs, up to ${MAX_RECEIPTS} files, 5MB each`}
          accept={RECEIPT_ACCEPT}
          maxSizeBytes={MAX_RECEIPT_SIZE_BYTES}
          maxFiles={MAX_RECEIPTS - keptReceipts.length}
          files={receipts}
          onChange={setReceipts}
        />
      </Box>
      {expense && (
        <ReceiptPreviewDialog
          expenseId={expense.id}
          receipts={keptReceipts}
          receiptId={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}
    </FormDialog>
  );
}
