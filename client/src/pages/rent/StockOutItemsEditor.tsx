import DeleteIcon from '@mui/icons-material/Delete';
import {
  Autocomplete,
  Box,
  Divider,
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
} from '@mui/material';
import type { RentalItem } from '../../types/rent';
import { formatCurrency } from '../../utils/format';
import {
  applyRentalItemToDraft,
  editStockOutDraftItem,
  removeStockOutDraftItem,
  stockOutRowAmount,
  type StockOutDraftItem,
  type StockOutDraftTotals,
} from './stockOutDraft';

interface StockOutItemsEditorProps {
  items: StockOutDraftItem[];
  onItemsChange: (items: StockOutDraftItem[]) => void;
  /** The rental item master, offered as suggestions. Free text is still accepted on every row. */
  masterItems: RentalItem[];
  discountPercent: string;
  additionalCharges: string;
  onDiscountPercentChange: (value: string) => void;
  onAdditionalChargesChange: (value: string) => void;
  totals: StockOutDraftTotals;
  error?: string | null;
  /**
   * Locks the grid once the stock out has returns booked against it (stock.md §32) — changing an
   * item or a quantity underneath a return would invalidate its balance arithmetic, so the server
   * refuses it and the form must not offer it.
   */
  itemsLocked?: boolean;
  lockedReason?: string;
}

/**
 * The rental item grid and money summary of a stock out being composed (stock.md §7, §8).
 *
 * Every figure updates as the user types: the row amount, the subtotal, and the grand total after
 * discount and additional charges.
 */
export function StockOutItemsEditor({
  items,
  onItemsChange,
  masterItems,
  discountPercent,
  additionalCharges,
  onDiscountPercentChange,
  onAdditionalChargesChange,
  totals,
  error,
  itemsLocked = false,
  lockedReason,
}: StockOutItemsEditorProps) {
  return (
    <Box>
      {itemsLocked && lockedReason && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {lockedReason}
        </Typography>
      )}

      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Item</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 110 }} align="right">
                Quantity
              </TableCell>
              <TableCell sx={{ fontWeight: 700, width: 130 }} align="right">
                Rate
              </TableCell>
              <TableCell sx={{ fontWeight: 700, width: 130 }} align="right">
                Amount
              </TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const rowTotal = stockOutRowAmount(item);
              const isTrailingEmpty = index === items.length - 1 && !item.itemName.trim();
              const selectedMaster = masterItems.find((master) => String(master.id) === item.rentalItemId) ?? null;

              return (
                <TableRow key={index}>
                  <TableCell>
                    {/* freeSolo: the master is a convenience, not a gate — an item can always be
                        typed in, and the line carries its own name snapshot either way. */}
                    <Autocomplete
                      freeSolo
                      size="small"
                      disabled={itemsLocked}
                      options={masterItems}
                      value={selectedMaster}
                      inputValue={item.itemName}
                      getOptionLabel={(option) => (typeof option === 'string' ? option : option.itemName)}
                      // freeSolo widens both sides to `string | RentalItem`; only two master rows
                      // are ever compared here, and a typed string is never equal to one.
                      isOptionEqualToValue={(option, value) =>
                        typeof option !== 'string' && typeof value !== 'string' && option.id === value.id
                      }
                      onChange={(_event, value) =>
                        onItemsChange(
                          applyRentalItemToDraft(items, index, typeof value === 'string' ? null : value),
                        )
                      }
                      onInputChange={(_event, value, reason) => {
                        if (reason === 'reset') return;
                        onItemsChange(editStockOutDraftItem(items, index, 'itemName', value));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={isTrailingEmpty ? 'Type or pick an item…' : 'Item name'}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      disabled={itemsLocked}
                      value={item.quantity}
                      onChange={(event) =>
                        onItemsChange(editStockOutDraftItem(items, index, 'quantity', event.target.value))
                      }
                      slotProps={{ htmlInput: { style: { textAlign: 'right' }, min: 0, step: 0.01 } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      disabled={itemsLocked}
                      value={item.rate}
                      onChange={(event) =>
                        onItemsChange(editStockOutDraftItem(items, index, 'rate', event.target.value))
                      }
                      slotProps={{ htmlInput: { style: { textAlign: 'right' }, min: 0, step: 0.01 } }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {rowTotal ? formatCurrency(rowTotal) : '—'}
                  </TableCell>
                  <TableCell>
                    {!itemsLocked && items.length > 1 && !isTrailingEmpty && (
                      <IconButton
                        size="small"
                        title="Remove item"
                        onClick={() => onItemsChange(removeStockOutDraftItem(items, index))}
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

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}

      <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1.5 }}>
        <TextField
          label="Discount %"
          type="number"
          size="small"
          sx={{ width: 170 }}
          value={discountPercent}
          onChange={(event) => onDiscountPercentChange(event.target.value)}
          helperText={totals.discount > 0 ? `= ${formatCurrency(totals.discount)} off` : 'Percentage of subtotal'}
          slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01, style: { textAlign: 'right' } } }}
        />
        <TextField
          label="Additional Charges"
          type="number"
          size="small"
          sx={{ width: 190 }}
          value={additionalCharges}
          onChange={(event) => onAdditionalChargesChange(event.target.value)}
          slotProps={{ htmlInput: { min: 0, step: 0.01, style: { textAlign: 'right' } } }}
        />
      </Stack>

      <Stack sx={{ mt: 2, alignItems: 'flex-end', gap: 0.5 }}>
        <SummaryRow label="Total Quantity" value={String(totals.totalQuantity)} />
        <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
        {totals.discount > 0 && (
          <SummaryRow label={`Discount (${totals.discountPercent}%)`} value={`− ${formatCurrency(totals.discount)}`} />
        )}
        {totals.additionalCharges > 0 && (
          <SummaryRow label="Additional Charges" value={`+ ${formatCurrency(totals.additionalCharges)}`} />
        )}
        <Divider flexItem sx={{ my: 0.5, width: '100%' }} />
        <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h4">Grand Total</Typography>
          <Typography variant="h4" sx={{ minWidth: 140, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(totals.grandTotal)}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', gap: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ minWidth: 140, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Stack>
  );
}
