import DeleteIcon from '@mui/icons-material/Delete';
import {
  Autocomplete,
  Box,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  type Theme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import * as rentService from '../../services/rentService';
import { formatCurrency } from '../../utils/format';
import {
  applyRentalItemToQuotationDraft,
  editQuotationDraftItem,
  removeQuotationDraftItem,
  type QuotationDraftItem,
  type QuotationDraftTotals,
} from './quotationDraft';

interface QuotationItemsEditorProps {
  items: QuotationDraftItem[];
  onItemsChange: (items: QuotationDraftItem[]) => void;
  cgstPercent: string;
  sgstPercent: string;
  onCgstChange: (value: string) => void;
  onSgstChange: (value: string) => void;
  totals: QuotationDraftTotals;
  error?: string | null;
  /**
   * Optional advance recorded against the quotation. When provided, an Advance field is offered
   * beside the tax percentages and the amount is deducted from the Grand Total.
   */
  advanceAmount?: string;
  onAdvanceChange?: (value: string) => void;
}

// The item table, tax percentages and totals of a quotation being composed — the same grid the
// Quotation form shows, reused wherever a quotation is raised without leaving the current page
// (the Enquiry form's inline draft, and the Create Quotation dialog on an enquiry).
export function QuotationItemsEditor({
  items,
  onItemsChange,
  cgstPercent,
  sgstPercent,
  onCgstChange,
  onSgstChange,
  totals,
  error,
  advanceAmount,
  onAdvanceChange,
}: QuotationItemsEditorProps) {
  // Four fixed-width numeric columns do not fit a phone, so below `sm` each item becomes a stacked
  // card instead of a table row.
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  const advance = Number(advanceAmount) || 0;
  // The customer's outstanding balance: the tax-inclusive total less whatever was paid up front.
  const grandTotal = totals.total - advance;

  // Stock Items master for autocomplete suggestions
  const { data: stockItems } = useQuery({
    queryKey: ['rent-items-active'],
    queryFn: () => rentService.listItems({ page: 1, limit: 500, status: 'ACTIVE' }),
    staleTime: 5 * 60 * 1000,
  });
  const stockItemOptions = stockItems?.records ?? [];

  return (
    <Box>
      {isMobile ? (
        <Stack spacing={1.5}>
          {items.map((item, index) => {
            const rowTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
            const isTrailingEmpty = index === items.length - 1 && !item.itemName.trim();
            const canDelete = items.length > 1 && !isTrailingEmpty;
            return (
              <Box
                key={index}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, display: 'grid', gap: 1.5 }}
              >
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Autocomplete
                    freeSolo
                    size="small"
                    fullWidth
                    options={stockItemOptions}
                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.itemName)}
                    inputValue={item.itemName}
                    onChange={(_event, value) => {
                      if (typeof value === 'string') {
                        onItemsChange(editQuotationDraftItem(items, index, 'itemName', value));
                      } else {
                        onItemsChange(applyRentalItemToQuotationDraft(items, index, value));
                      }
                    }}
                    onInputChange={(_event, value, reason) => {
                      if (reason === 'reset') return;
                      onItemsChange(editQuotationDraftItem(items, index, 'itemName', value));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Item"
                        placeholder={isTrailingEmpty ? 'Type to add an item…' : 'Item name'}
                      />
                    )}
                  />
                  {canDelete && (
                    <IconButton
                      size="small"
                      color="error"
                      title="Delete item"
                      onClick={() => onItemsChange(removeQuotationDraftItem(items, index))}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                  <TextField
                    size="small"
                    label="Quantity"
                    value={item.quantity}
                    onChange={(event) =>
                      onItemsChange(
                        editQuotationDraftItem(items, index, 'quantity', event.target.value.replace(/[^0-9]/g, ''))
                      )
                    }
                    slotProps={{ htmlInput: { inputMode: 'numeric', style: { textAlign: 'right' } } }}
                  />
                  <TextField
                    size="small"
                    label="Unit Price"
                    value={item.rate}
                    onChange={(event) =>
                      onItemsChange(
                        editQuotationDraftItem(
                          items,
                          index,
                          'rate',
                          event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                        )
                      )
                    }
                    slotProps={{ htmlInput: { inputMode: 'decimal', style: { textAlign: 'right' } } }}
                  />
                </Box>
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Sub Total
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {rowTotal ? formatCurrency(rowTotal) : '—'}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : (
      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 110 }} align="right">
                Quantity
              </TableCell>
              <TableCell sx={{ fontWeight: 700, width: 130 }} align="right">
                Unit Price
              </TableCell>
              <TableCell sx={{ fontWeight: 700, width: 130 }} align="right">
                Sub Total
              </TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const rowTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
              const isTrailingEmpty = index === items.length - 1 && !item.itemName.trim();
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Autocomplete
                      freeSolo
                      size="small"
                      options={stockItemOptions}
                      getOptionLabel={(option) => (typeof option === 'string' ? option : option.itemName)}
                      inputValue={item.itemName}
                      onChange={(_event, value) => {
                        if (typeof value === 'string') {
                          onItemsChange(editQuotationDraftItem(items, index, 'itemName', value));
                        } else {
                          onItemsChange(applyRentalItemToQuotationDraft(items, index, value));
                        }
                      }}
                      onInputChange={(_event, value, reason) => {
                        if (reason === 'reset') return;
                        onItemsChange(editQuotationDraftItem(items, index, 'itemName', value));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={isTrailingEmpty ? 'Type to add an item…' : 'Item name'}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      fullWidth
                      value={item.quantity}
                      onChange={(event) =>
                        onItemsChange(
                          editQuotationDraftItem(items, index, 'quantity', event.target.value.replace(/[^0-9]/g, ''))
                        )
                      }
                      slotProps={{ htmlInput: { inputMode: 'numeric', style: { textAlign: 'right' } } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      fullWidth
                      value={item.rate}
                      onChange={(event) =>
                        onItemsChange(
                          editQuotationDraftItem(
                            items,
                            index,
                            'rate',
                            event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                          )
                        )
                      }
                      slotProps={{ htmlInput: { inputMode: 'decimal', style: { textAlign: 'right' } } }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {rowTotal ? formatCurrency(rowTotal) : '—'}
                  </TableCell>
                  <TableCell>
                    {items.length > 1 && !isTrailingEmpty && (
                      <IconButton
                        size="small"
                        color="error"
                        title="Delete item"
                        onClick={() => onItemsChange(removeQuotationDraftItem(items, index))}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}

      <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1.5 }}>
        <TextField
          label="CGST %"
          type="number"
          size="small"
          sx={{ width: 130 }}
          value={cgstPercent}
          onChange={(event) => onCgstChange(event.target.value)}
          slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01, style: { textAlign: 'right' } } }}
        />
        <TextField
          label="SGST %"
          type="number"
          size="small"
          sx={{ width: 130 }}
          value={sgstPercent}
          onChange={(event) => onSgstChange(event.target.value)}
          slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01, style: { textAlign: 'right' } } }}
        />
        {onAdvanceChange && (
          <TextField
            label="Advance Amount"
            type="number"
            size="small"
            sx={{ width: 170 }}
            value={advanceAmount ?? ''}
            onChange={(event) => onAdvanceChange(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 0.01, style: { textAlign: 'right' } } }}
          />
        )}
      </Stack>

      <Stack sx={{ mt: 1.5, alignItems: 'flex-end', gap: 0.5 }}>
        <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Subtotal
          </Typography>
          <Typography variant="body2" sx={{ minWidth: 120, textAlign: 'right' }}>
            {formatCurrency(totals.subtotal)}
          </Typography>
        </Stack>
        {totals.cgstAmount > 0 && (
          <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              CGST ({totals.cgstPercent}%)
            </Typography>
            <Typography variant="body2" sx={{ minWidth: 120, textAlign: 'right' }}>
              {formatCurrency(totals.cgstAmount)}
            </Typography>
          </Stack>
        )}
        {totals.sgstAmount > 0 && (
          <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              SGST ({totals.sgstPercent}%)
            </Typography>
            <Typography variant="body2" sx={{ minWidth: 120, textAlign: 'right' }}>
              {formatCurrency(totals.sgstAmount)}
            </Typography>
          </Stack>
        )}
        {advance > 0 && (
          <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Advance
            </Typography>
            <Typography variant="body2" sx={{ minWidth: 120, textAlign: 'right' }}>
              - {formatCurrency(advance)}
            </Typography>
          </Stack>
        )}
        <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h4">Grand Total</Typography>
          <Typography variant="h4" sx={{ minWidth: 120, textAlign: 'right' }}>
            {formatCurrency(grandTotal)}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
