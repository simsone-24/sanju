import EventNoteIcon from '@mui/icons-material/EventNote';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PaymentsIcon from '@mui/icons-material/Payments';
import { Alert, Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePickerField } from '../../components/DatePickerField';
import { FormPage } from '../../components/FormPage';
import { FormSection } from '../../components/FormSection';
import { usePermission } from '../../hooks/usePermission';
import * as rentService from '../../services/rentService';
import { useToast } from '../../store/ToastContext';
import type { CreateStockOutInput, RentalPerson, UpdateStockOutInput } from '../../types/rent';
import { describeApiError } from '../../utils/apiError';
import { InlinePaymentFields } from './InlinePaymentFields';
import {
  EMPTY_INLINE_PAYMENT,
  inlinePaymentError,
  toInlinePaymentInput,
  type InlinePaymentDraft,
} from './inlinePayment';
import { StockOutItemsEditor } from './StockOutItemsEditor';
import {
  EMPTY_STOCK_OUT_ITEM,
  stockOutDraftTotals,
  stockOutToDraftItems,
  toStockOutItemsInput,
  type StockOutDraftItem,
} from './stockOutDraft';

// Only ACTIVE people can start a new transaction (stock.md §5), so the picker asks for the active
// ones. The person of a stock out being edited is never changed, so an inactive one is never needed.
const PERSON_PICKER_LIMIT = 100;

/** Just enough of a rental person to identify one in the picker — the form needs nothing else. */
interface PersonOption {
  id: string;
  name: string;
  phone: string;
}

function toPersonOption(person: Pick<RentalPerson, 'id' | 'name' | 'phone'>): PersonOption {
  return { id: person.id, name: person.name, phone: person.phone };
}

export default function StockOutFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const canCreate = usePermission('RENT', 'canCreate');
  const canEdit = usePermission('RENT', 'canEdit');
  const allowed = isEdit ? canEdit : canCreate;

  const [rentalPerson, setRentalPerson] = useState<PersonOption | null>(null);
  const [stockOutDate, setStockOutDate] = useState<Dayjs | null>(dayjs());
  const [expectedReturnDate, setExpectedReturnDate] = useState<Dayjs | null>(null);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<StockOutDraftItem[]>([{ ...EMPTY_STOCK_OUT_ITEM }]);
  const [discountPercent, setDiscountPercent] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('');
  const [initialPayment, setInitialPayment] = useState<InlinePaymentDraft>({ ...EMPTY_INLINE_PAYMENT });

  const [itemsError, setItemsError] = useState<string | null>(null);
  const [personError, setPersonError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const { data: persons } = useQuery({
    queryKey: ['rent-persons', 'picker'],
    queryFn: () => rentService.listPersons({ limit: PERSON_PICKER_LIMIT, status: 'ACTIVE' }),
    enabled: allowed,
  });

  const { data: masterItems } = useQuery({
    queryKey: ['rent-items', 'picker'],
    queryFn: () => rentService.listItems({ limit: 100, status: 'ACTIVE' }),
    enabled: allowed,
  });

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['rent-stock-out', id],
    queryFn: () => rentService.getStockOut(id!),
    enabled: isEdit && allowed,
  });

  // Items are frozen once anything has come back (stock.md §32). The grid is locked rather than
  // hidden so the user can still read what was issued while editing the header.
  const itemsLocked = Boolean(existing && existing.returnCount > 0);

  useEffect(() => {
    if (!existing) return;
    setRentalPerson(toPersonOption(existing.rentalPerson));
    setStockOutDate(dayjs(existing.stockOutDate));
    setExpectedReturnDate(existing.expectedReturnDate ? dayjs(existing.expectedReturnDate) : null);
    setNotes(existing.notes ?? '');
    setItems(stockOutToDraftItems(existing));
    setDiscountPercent(existing.discountPercent ? String(existing.discountPercent) : '');
    setAdditionalCharges(existing.additionalCharges ? String(existing.additionalCharges) : '');
    setDirty(false);
  }, [existing]);

  const totals = useMemo(
    () => stockOutDraftTotals(items, discountPercent, additionalCharges),
    [items, discountPercent, additionalCharges],
  );

  const createMutation = useMutation({
    mutationFn: (input: CreateStockOutInput) => rentService.createStockOut(input),
  });
  const updateMutation = useMutation({
    mutationFn: (input: UpdateStockOutInput) => rentService.updateStockOut(id!, input),
  });
  const saving = createMutation.isPending || updateMutation.isPending;

  function track<T>(setter: (value: T) => void) {
    return (value: T) => {
      setDirty(true);
      setter(value);
    };
  }

  async function handleSave() {
    setServerError(null);
    setPersonError(null);
    setItemsError(null);

    if (!rentalPerson) {
      setPersonError('Select a rental person.');
      return;
    }
    if (!stockOutDate) {
      setServerError('Select a stock out date.');
      return;
    }

    const parsed = toStockOutItemsInput(items);
    // A locked grid contributes nothing to the payload — the server rejects any item change once a
    // return exists, so the edit sends the header alone.
    if (!itemsLocked && parsed.error) {
      setItemsError(parsed.error);
      return;
    }
    if (totals.discountPercent > 100) {
      setItemsError('Discount cannot exceed 100%.');
      return;
    }

    const paymentError = inlinePaymentError(initialPayment, totals.grandTotal);
    if (paymentError) {
      setServerError(paymentError);
      return;
    }

    const money = {
      discountPercent: Number(discountPercent) || 0,
      additionalCharges: Number(additionalCharges) || 0,
      notes: notes.trim() || undefined,
      stockOutDate: stockOutDate.toISOString(),
      expectedReturnDate: expectedReturnDate ? expectedReturnDate.toISOString() : undefined,
    };

    try {
      const saved = isEdit
        ? await updateMutation.mutateAsync({ ...money, ...(itemsLocked ? {} : { items: parsed.items! }) })
        : await createMutation.mutateAsync({
            ...money,
            rentalPersonId: rentalPerson.id,
            items: parsed.items!,
            initialPayment: toInlinePaymentInput(initialPayment),
          });

      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['rent-stock-outs'] });
      queryClient.invalidateQueries({ queryKey: ['rent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['rent-stock-out', saved.id] });
      // A new stock out may have taken an advance, and always changes the person's totals.
      queryClient.invalidateQueries({ queryKey: ['rent-payments'] });
      queryClient.invalidateQueries({ queryKey: ['rent-payment-summary'] });
      queryClient.invalidateQueries({ queryKey: ['rent-persons'] });
      showToast(isEdit ? 'Stock out updated.' : `Stock out ${saved.rentNo} created.`);
      navigate(`/rent/stock-outs/${saved.id}`);
    } catch (error) {
      setServerError(describeApiError(error, 'Unable to save the stock out. Please try again.'));
    }
  }

  if (!allowed) {
    return <Typography color="text.secondary">You do not have permission to manage stock outs.</Typography>;
  }

  if (isEdit && loadingExisting) {
    return <Typography color="text.secondary">Loading stock out…</Typography>;
  }

  if (isEdit && existing?.status === 'CANCELLED') {
    return (
      <Alert severity="warning">
        {existing.rentNo} has been cancelled and can no longer be edited.
      </Alert>
    );
  }

  return (
    <FormPage
      breadcrumbs={[
        { label: 'Dashboard', to: '/' },
        { label: 'Rent', to: '/rent' },
        { label: 'Stock Out', to: '/rent/stock-outs' },
        { label: isEdit ? (existing?.rentNo ?? 'Edit') : 'New Stock Out' },
      ]}
      title={isEdit ? `Edit ${existing?.rentNo ?? 'Stock Out'}` : 'New Stock Out'}
      subtitle={
        isEdit
          ? 'Update the transaction. Issued items are locked once stock has been returned.'
          : 'Record the items handed to a rental person, with their quantity and rental rate.'
      }
      onCancel={() => navigate(isEdit ? `/rent/stock-outs/${id}` : '/rent/stock-outs')}
      onSave={handleSave}
      saving={saving}
      saveLabel={isEdit ? 'Save Changes' : 'Create Stock Out'}
      isDirty={dirty}
      serverError={serverError}
    >
      <FormSection title="Stock Out Details" icon={<EventNoteIcon />}>
        <Autocomplete
          options={(persons?.records ?? []).map(toPersonOption)}
          value={rentalPerson}
          disabled={isEdit}
          getOptionLabel={(option) => `${option.name} — ${option.phone}`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_event, value) => {
            setDirty(true);
            setRentalPerson(value);
            setPersonError(null);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Rental Person"
              required
              size="small"
              error={Boolean(personError)}
              helperText={
                personError ??
                (isEdit
                  ? 'The rental person of a saved stock out cannot be changed.'
                  : 'Only active rental persons can be selected.')
              }
            />
          )}
        />

        <Box />

        <DatePickerField
          label="Stock Out Date"
          margin="none"
          required
          value={stockOutDate}
          onChange={track(setStockOutDate)}
        />
        <DatePickerField
          label="Expected Return Date"
          margin="none"
          value={expectedReturnDate}
          onChange={track(setExpectedReturnDate)}
          minDate={stockOutDate ?? undefined}
        />

        <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
          <TextField
            label="Notes"
            fullWidth
            multiline
            minRows={2}
            size="small"
            value={notes}
            onChange={(event) => track(setNotes)(event.target.value)}
          />
        </Box>
      </FormSection>

      <FormSection title="Rental Items" icon={<Inventory2Icon />}>
        <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
          <StockOutItemsEditor
            items={items}
            onItemsChange={track(setItems)}
            masterItems={masterItems?.records ?? []}
            discountPercent={discountPercent}
            additionalCharges={additionalCharges}
            onDiscountPercentChange={track(setDiscountPercent)}
            onAdditionalChargesChange={track(setAdditionalCharges)}
            totals={totals}
            error={itemsError}
            itemsLocked={itemsLocked}
            lockedReason={
              itemsLocked
                ? 'Stock has already been returned against this transaction, so its items and quantities are locked. Dates, notes, discount and additional charges can still be changed.'
                : undefined
            }
          />
        </Box>
      </FormSection>

      {/* Create only — once the stock out exists, further money goes through Add Payment or is
          collected with a return, so there is one way to add a second receipt rather than three. */}
      {!isEdit && (
        <FormSection
          title="Initial Payment"
          subtitle="Optional. Record an advance taken as the stock goes out."
          icon={<PaymentsIcon />}
        >
          <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
            <InlinePaymentFields
              value={initialPayment}
              onChange={track(setInitialPayment)}
              maxAmount={totals.grandTotal}
              toggleLabel="Take an advance now"
              maxAmountLabel="Grand total"
            />
          </Box>
        </FormSection>
      )}
    </FormPage>
  );
}
