import type { QuotationItemInput } from '../../types/quotation';

// The item rows of a quotation being composed outside the full Quotation form — held as plain
// strings so a half-typed row ("2", "") is representable while the user is still typing, and
// converted to the API's numeric shape only at submit time.
//
// Shared by the Enquiry form's inline "create a quotation with this enquiry" draft and the
// Create Quotation dialog raised from an enquiry, so both behave identically and neither carries
// its own copy of the totals/validation rules.
export interface QuotationDraftItem {
  itemName: string;
  quantity: string;
  rate: string;
}

export const EMPTY_QUOTATION_DRAFT_ITEM: QuotationDraftItem = { itemName: '', quantity: '', rate: '' };

export interface QuotationDraftTotals {
  cgstPercent: number;
  sgstPercent: number;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  total: number;
}

/** Mirrors the server's own rounding (2 decimals per tax component) so the preview matches the save. */
export function quotationDraftTotals(
  items: QuotationDraftItem[],
  cgstPercent: string,
  sgstPercent: string,
): QuotationDraftTotals {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
  const cgst = Number(cgstPercent) || 0;
  const sgst = Number(sgstPercent) || 0;
  const cgstAmount = Math.round(((subtotal * cgst) / 100) * 100) / 100;
  const sgstAmount = Math.round(((subtotal * sgst) / 100) * 100) / 100;
  return {
    cgstPercent: cgst,
    sgstPercent: sgst,
    subtotal,
    cgstAmount,
    sgstAmount,
    total: subtotal + cgstAmount + sgstAmount,
  };
}

/**
 * Applies one cell edit. Naming the trailing row spawns a fresh empty one, matching the Quotation
 * form's auto-add-row behaviour — there is never an explicit "Add Item" button to hunt for.
 */
export function editQuotationDraftItem(
  items: QuotationDraftItem[],
  index: number,
  field: keyof QuotationDraftItem,
  value: string,
): QuotationDraftItem[] {
  const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
  if (field === 'itemName' && index === items.length - 1 && value.trim() !== '') {
    next.push({ ...EMPTY_QUOTATION_DRAFT_ITEM });
  }
  return next;
}

/** The last row is the one being typed into, so it is never removable — there is always one row. */
export function removeQuotationDraftItem(items: QuotationDraftItem[], index: number): QuotationDraftItem[] {
  return items.length > 1 ? items.filter((_, i) => i !== index) : items;
}

export type QuotationDraftItemsResult =
  | { items: QuotationItemInput[]; error: null }
  | { items: null; error: string };

/**
 * Drops the trailing empty rows and converts what is left to the API's item shape, or reports the
 * first problem found. `emptyMessage` differs per caller because the way to resolve "no items"
 * differs (turn the draft off, versus type something in).
 */
export function toQuotationItemsInput(
  items: QuotationDraftItem[],
  emptyMessage: string,
): QuotationDraftItemsResult {
  const named = items.filter((item) => item.itemName.trim() !== '');
  if (named.length === 0) return { items: null, error: emptyMessage };
  if (named.some((item) => !(Number(item.quantity) > 0) || !(Number(item.rate) >= 0))) {
    return { items: null, error: 'Enter a valid quantity and unit price for every item.' };
  }
  return {
    items: named.map((item, index) => ({
      itemName: item.itemName.trim(),
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      sortOrder: index,
    })),
    error: null,
  };
}
