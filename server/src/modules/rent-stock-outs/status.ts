import { RentPaymentStatus, StockReturnStatus } from '@prisma/client';

/**
 * Rent's money and quantity arithmetic, in one place.
 *
 * Both statuses are DERIVED — "md files/Stock/stock.md" §10 and §23 forbid a user setting either by
 * hand, and §36 Rules 9/10 restate it. The stored columns exist only so the lists can filter and
 * sort on them across a paginated result set; every writer recomputes them here from the child rows
 * inside the same transaction (see service.ts recalculate()).
 */

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Quantities carry two decimals (metres of cloth as readily as whole chairs). */
export function roundQuantity(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * A tolerance for "is the balance zero", not a rounding step.
 *
 * Both sides of the comparison are already rounded to two decimals, so anything smaller than half a
 * paisa/unit is float noise from summing many rows rather than a real outstanding balance — without
 * this, a fully returned stock out could sit at 1e-14 and never reach RETURNED.
 */
const EPSILON = 0.005;

export function deriveReturnStatus(issuedQuantity: number, returnedQuantity: number): StockReturnStatus {
  const balance = roundQuantity(issuedQuantity - returnedQuantity);
  if (balance <= EPSILON) return StockReturnStatus.RETURNED;
  if (returnedQuantity > EPSILON) return StockReturnStatus.PARTIAL_RETURNED;
  return StockReturnStatus.NOT_RETURNED;
}

export function deriveRentPaymentStatus(grandTotal: number, paidAmount: number): RentPaymentStatus {
  const balance = roundCurrency(grandTotal - paidAmount);
  if (balance <= EPSILON) return RentPaymentStatus.PAID;
  if (paidAmount > EPSILON) return RentPaymentStatus.PARTIALLY_PAID;
  return RentPaymentStatus.UNPAID;
}

export interface StockOutAmountInput {
  quantity: number;
  rate: number;
}

export interface StockOutAmounts {
  items: (StockOutAmountInput & { amount: number })[];
  subtotal: number;
  discountPercent: number;
  discount: number;
  additionalCharges: number;
  grandTotal: number;
  issuedQuantity: number;
}

/**
 * stock.md §8 — Amount = Quantity × Rate, Subtotal = Σ Amount,
 * Grand Total = Subtotal − Discount + Additional Charges.
 *
 * The discount is entered as a percentage and applied to the subtotal only: additional charges are
 * a pass-through cost (transport, labour) rather than part of what is being discounted, so
 * discounting them would quietly hand back money on someone else's bill.
 *
 * Computed server-side from quantity and rate alone: the amounts the browser displays are a
 * convenience, never the figures that get stored.
 */
export function computeStockOutAmounts<T extends StockOutAmountInput>(
  items: T[],
  discountPercent: number,
  additionalCharges: number,
): StockOutAmounts & { items: (T & { amount: number })[] } {
  const itemsWithAmount = items.map((item) => ({
    ...item,
    amount: roundCurrency(item.quantity * item.rate),
  }));

  const subtotal = roundCurrency(itemsWithAmount.reduce((sum, item) => sum + item.amount, 0));
  const discount = roundCurrency((subtotal * discountPercent) / 100);
  const grandTotal = roundCurrency(subtotal - discount + additionalCharges);
  const issuedQuantity = roundQuantity(itemsWithAmount.reduce((sum, item) => sum + item.quantity, 0));

  return {
    items: itemsWithAmount,
    subtotal,
    discountPercent,
    discount,
    additionalCharges,
    grandTotal,
    issuedQuantity,
  };
}
