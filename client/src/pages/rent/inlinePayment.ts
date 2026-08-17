import type { InlinePaymentInput, RentPaymentMode } from '../../types/rent';
import { formatCurrency } from '../../utils/format';

/**
 * The state behind the optional "take money now" block — held as strings, because that is what an
 * <input> holds, and converted to the API's numeric shape only at submit.
 *
 * Shared by the stock out form (an advance taken as stock goes out) and the return dialog (the
 * balance settled at handover), so both apply the same rules to the same fields.
 */
export interface InlinePaymentDraft {
  enabled: boolean;
  amount: string;
  paymentMode: RentPaymentMode;
  referenceNo: string;
}

export const EMPTY_INLINE_PAYMENT: InlinePaymentDraft = {
  enabled: false,
  amount: '',
  paymentMode: 'CASH',
  referenceNo: '',
};

/**
 * Whether the block is filled in well enough to send, or null when it is fine.
 *
 * `maxAmount` mirrors the server's own ceiling (stock.md §22 — a collection may not exceed what is
 * outstanding), so the user is told before the round trip rather than instead of it.
 */
export function inlinePaymentError(value: InlinePaymentDraft, maxAmount: number): string | null {
  if (!value.enabled) return null;

  const amount = Number(value.amount) || 0;
  if (amount <= 0) return 'Enter the amount being paid, or turn the payment off.';
  if (amount > maxAmount) return `Payment cannot exceed ${formatCurrency(maxAmount)}.`;
  return null;
}

/** The API shape, or undefined when no money is changing hands. */
export function toInlinePaymentInput(value: InlinePaymentDraft): InlinePaymentInput | undefined {
  if (!value.enabled) return undefined;

  const amount = Number(value.amount) || 0;
  if (amount <= 0) return undefined;

  return {
    amount,
    paymentMode: value.paymentMode,
    referenceNo: value.referenceNo.trim() || undefined,
  };
}
