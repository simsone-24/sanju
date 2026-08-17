import type { StockOutDetail, StockOutItemInput, RentalItem } from '../../types/rent';

/**
 * The rental item rows of a stock out being composed.
 *
 * Held as strings so a half-typed row ("2", "") stays representable while the user is typing, and
 * converted to the API's numeric shape only at submit. The same approach the Quotation form takes
 * (see quotations/quotationDraft.ts) — this is a separate copy rather than a shared one because the
 * two documents have genuinely different columns and totals, and merging them would mean a rule for
 * one becoming a conditional in the other.
 */
export interface StockOutDraftItem {
  /** Set when the row was picked from the rental item master; blank for a free-typed line. */
  rentalItemId: string;
  itemName: string;
  quantity: string;
  rate: string;
}

export const EMPTY_STOCK_OUT_ITEM: StockOutDraftItem = {
  rentalItemId: '',
  itemName: '',
  quantity: '',
  rate: '',
};

export interface StockOutDraftTotals {
  subtotal: number;
  discountPercent: number;
  /** The money the percentage works out to, so the form can show both. */
  discount: number;
  additionalCharges: number;
  grandTotal: number;
  totalQuantity: number;
}

export function stockOutRowAmount(item: StockOutDraftItem): number {
  return (Number(item.quantity) || 0) * (Number(item.rate) || 0);
}

/**
 * stock.md §8 — Subtotal = Σ (Quantity × Rate), Grand Total = Subtotal − Discount + Charges.
 *
 * The discount is a percentage of the subtotal; additional charges are outside it (they are a
 * pass-through cost, not part of what is being discounted). Rounded exactly as the server rounds
 * it — see rent-stock-outs/status.ts — so the figure on screen is the figure that gets saved.
 */
export function stockOutDraftTotals(
  items: StockOutDraftItem[],
  discountPercent: string,
  additionalCharges: string,
): StockOutDraftTotals {
  const round = (value: number) => Math.round(value * 100) / 100;

  const subtotal = round(items.reduce((sum, item) => sum + round(stockOutRowAmount(item)), 0));
  const percent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discount = round((subtotal * percent) / 100);
  const chargesValue = Number(additionalCharges) || 0;

  return {
    subtotal,
    discountPercent: percent,
    discount,
    additionalCharges: chargesValue,
    grandTotal: round(subtotal - discount + chargesValue),
    totalQuantity: round(items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)),
  };
}

/**
 * Applies one cell edit. Naming the trailing row spawns a fresh empty one, so there is never an
 * "Add Item" button to hunt for — the same behaviour as the Quotation form's item grid.
 */
export function editStockOutDraftItem(
  items: StockOutDraftItem[],
  index: number,
  field: keyof StockOutDraftItem,
  value: string,
): StockOutDraftItem[] {
  const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
  if (field === 'itemName' && index === items.length - 1 && value.trim() !== '') {
    next.push({ ...EMPTY_STOCK_OUT_ITEM });
  }
  return next;
}

/**
 * Applies a pick from the rental item master, seeding the row's rate from the master's default.
 * The rate is only seeded while the row is still blank, so re-picking an item never overwrites a
 * rate the user has deliberately typed.
 */
export function applyRentalItemToDraft(
  items: StockOutDraftItem[],
  index: number,
  master: RentalItem | null,
): StockOutDraftItem[] {
  const next = items.map((item, i) => {
    if (i !== index) return item;
    if (!master) return { ...item, rentalItemId: '' };
    return {
      ...item,
      rentalItemId: master.id,
      itemName: master.itemName,
      rate: item.rate === '' && master.defaultRentRate !== null ? String(Number(master.defaultRentRate)) : item.rate,
    };
  });

  if (master && index === items.length - 1) next.push({ ...EMPTY_STOCK_OUT_ITEM });
  return next;
}

/** The last row is the one being typed into, so it is never removable — there is always one row. */
export function removeStockOutDraftItem(items: StockOutDraftItem[], index: number): StockOutDraftItem[] {
  return items.length > 1 ? items.filter((_, i) => i !== index) : items;
}

export type StockOutItemsResult =
  | { items: StockOutItemInput[]; error: null }
  | { items: null; error: string };

/** Drops the trailing empty rows and converts what is left, or reports the first problem found. */
export function toStockOutItemsInput(items: StockOutDraftItem[]): StockOutItemsResult {
  const named = items.filter((item) => item.itemName.trim() !== '');
  if (named.length === 0) return { items: null, error: 'Add at least one rental item.' };
  if (named.some((item) => !(Number(item.quantity) > 0))) {
    return { items: null, error: 'Enter a quantity greater than zero for every item.' };
  }
  if (named.some((item) => item.rate === '' || !(Number(item.rate) >= 0))) {
    return { items: null, error: 'Enter a rental rate for every item.' };
  }

  return {
    items: named.map((item, index) => ({
      rentalItemId: item.rentalItemId || undefined,
      itemName: item.itemName.trim(),
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      sortOrder: index,
    })),
    error: null,
  };
}

/** Seeds the edit form from a saved stock out, plus the trailing blank row for adding to it. */
export function stockOutToDraftItems(stockOut: StockOutDetail): StockOutDraftItem[] {
  return [
    ...stockOut.items.map((item) => ({
      rentalItemId: item.rentalItemId ?? '',
      itemName: item.itemName,
      quantity: String(item.quantity),
      rate: String(item.rate),
    })),
    { ...EMPTY_STOCK_OUT_ITEM },
  ];
}
