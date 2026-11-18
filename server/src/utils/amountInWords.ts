const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

// 0–999 spelled out; the caller adds the Thousand / Lakh / Crore label.
function belowThousand(value: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const rest = value % 100;
  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest > 0) parts.push(rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? ` ${ONES[rest % 10]}` : ''}`);
  return parts.join(' ');
}

function wholeNumberInWords(value: number): string {
  if (value === 0) return 'Zero';
  const parts: string[] = [];
  let remaining = value;
  // Indian grouping: crore (10^7), lakh (10^5), thousand, then the last three digits.
  for (const [size, label] of [[10_000_000, 'Crore'], [100_000, 'Lakh'], [1_000, 'Thousand']] as const) {
    const count = Math.floor(remaining / size);
    if (count > 0) {
      parts.push(`${wholeNumberInWords(count)} ${label}`);
      remaining %= size;
    }
  }
  if (remaining > 0) parts.push(belowThousand(remaining));
  return parts.join(' ');
}

/** "Rupees Two Lakh Ninety Seven Thousand Only" — Indian digit grouping, with paise when present. */
export function amountInWords(amount: number): string {
  const paiseTotal = Math.round(Math.abs(amount) * 100);
  const rupees = Math.floor(paiseTotal / 100);
  const paise = paiseTotal % 100;
  const paiseText = paise > 0 ? ` and ${belowThousand(paise)} Paise` : '';
  return `Rupees ${wholeNumberInWords(rupees)}${paiseText} Only`;
}
