import { Stack, TextField, Typography } from '@mui/material';
import { formatCurrency } from '../../utils/format';
import type { QuotationDraftTotals } from './quotationDraft';

interface QuotationTaxTotalsProps {
  cgstPercent: string;
  sgstPercent: string;
  onCgstChange: (value: string) => void;
  onSgstChange: (value: string) => void;
  totals: QuotationDraftTotals;
  /**
   * Optional advance recorded against the quotation. When provided, an Advance field is offered
   * beside the tax percentages and the amount is deducted from the Grand Total.
   */
  advanceAmount?: string;
  onAdvanceChange?: (value: string) => void;
}

// The tax percentages and the Subtotal / CGST / SGST / Advance / Grand Total block shown under a
// quotation being composed — shared by the flat item editor and the section-wise editor so the two
// always total the same way.
export function QuotationTaxTotals({
  cgstPercent,
  sgstPercent,
  onCgstChange,
  onSgstChange,
  totals,
  advanceAmount,
  onAdvanceChange,
}: QuotationTaxTotalsProps) {
  const advance = Number(advanceAmount) || 0;
  // The customer's outstanding balance: the tax-inclusive total less whatever was paid up front.
  const grandTotal = totals.total - advance;

  return (
    <>
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
    </>
  );
}
