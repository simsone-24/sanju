/** Compact money/number format for chart axes — "12K", "1.2L" in the en-IN locale. */
export const compactNumber = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

/** Rounds an axis maximum up to 1, 2, 2.5, 5 or 10 × a power of ten so the gridlines land on round numbers. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const fraction = value / magnitude;
  const step = [1, 2, 2.5, 5, 10].find((candidate) => fraction <= candidate) ?? 10;
  return step * magnitude;
}
