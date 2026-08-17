import { Box, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { RENT_PAYMENT_MODES, type RentPaymentMode } from '../../types/rent';
import { formatCurrency } from '../../utils/format';
import type { InlinePaymentDraft } from './inlinePayment';

interface InlinePaymentFieldsProps {
  value: InlinePaymentDraft;
  onChange: (value: InlinePaymentDraft) => void;
  /** The most that may be taken right now — the grand total, or the outstanding balance. */
  maxAmount: number;
  /** Wording for the toggle, e.g. "Take an advance now". */
  toggleLabel: string;
  /** Names the figure in the caption under the toggle, e.g. "Grand total". */
  maxAmountLabel: string;
  disabled?: boolean;
}

/**
 * The optional "take money now" block, shared by the stock out form (an advance) and the return
 * dialog (settling the balance).
 *
 * Off by default and collapsed to a single switch: most saves take no money, and a payment section
 * always sitting open invites someone to fill it in by reflex. The switch is disabled outright when
 * nothing is outstanding, so a settled transaction cannot be over-collected.
 */
export function InlinePaymentFields({
  value,
  onChange,
  maxAmount,
  toggleLabel,
  maxAmountLabel,
  disabled = false,
}: InlinePaymentFieldsProps) {
  const entered = Number(value.amount) || 0;
  const overMax = entered > maxAmount;

  function set<K extends keyof InlinePaymentDraft>(key: K, next: InlinePaymentDraft[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Switch
          checked={value.enabled}
          disabled={disabled || maxAmount <= 0}
          onChange={(event) => set('enabled', event.target.checked)}
        />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {toggleLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {maxAmount > 0 ? `${maxAmountLabel}: ${formatCurrency(maxAmount)}` : 'Nothing is outstanding.'}
          </Typography>
        </Box>
      </Stack>

      {value.enabled && maxAmount > 0 && (
        <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 2 }}>
          <TextField
            label="Amount"
            type="number"
            size="small"
            required
            sx={{ width: 170 }}
            value={value.amount}
            onChange={(event) => set('amount', event.target.value)}
            error={overMax}
            helperText={overMax ? `Maximum ${formatCurrency(maxAmount)}` : undefined}
            slotProps={{ htmlInput: { min: 0, max: maxAmount, step: 0.01 } }}
          />
          <TextField
            select
            label="Payment Mode"
            size="small"
            sx={{ width: 180 }}
            value={value.paymentMode}
            onChange={(event) => set('paymentMode', event.target.value as RentPaymentMode)}
          >
            {RENT_PAYMENT_MODES.map((mode) => (
              <MenuItem key={mode.value} value={mode.value}>
                {mode.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Reference Number"
            size="small"
            sx={{ flexGrow: 1, minWidth: 180 }}
            value={value.referenceNo}
            onChange={(event) => set('referenceNo', event.target.value)}
          />
        </Stack>
      )}
    </Box>
  );
}
