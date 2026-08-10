import DeleteIcon from '@mui/icons-material/Delete';
import {
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
} from '@mui/material';
import { formatCurrency } from '../../utils/format';
import {
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
}: QuotationItemsEditorProps) {
  return (
    <Box>
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
                    <TextField
                      size="small"
                      fullWidth
                      placeholder={isTrailingEmpty ? 'Type to add an item…' : 'Item name'}
                      value={item.itemName}
                      onChange={(event) => onItemsChange(editQuotationDraftItem(items, index, 'itemName', event.target.value))}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      value={item.quantity}
                      onChange={(event) => onItemsChange(editQuotationDraftItem(items, index, 'quantity', event.target.value))}
                      slotProps={{ htmlInput: { style: { textAlign: 'right' }, min: 0 } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      value={item.rate}
                      onChange={(event) => onItemsChange(editQuotationDraftItem(items, index, 'rate', event.target.value))}
                      slotProps={{ htmlInput: { style: { textAlign: 'right' }, min: 0 } }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {rowTotal ? formatCurrency(rowTotal) : '—'}
                  </TableCell>
                  <TableCell>
                    {items.length > 1 && !isTrailingEmpty && (
                      <IconButton
                        size="small"
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

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}

      <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
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
        <Stack direction="row" sx={{ justifyContent: 'flex-end', width: '100%', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h4">Grand Total</Typography>
          <Typography variant="h4" sx={{ minWidth: 120, textAlign: 'right' }}>
            {formatCurrency(totals.total)}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
