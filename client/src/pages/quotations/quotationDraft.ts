import type { QuotationItemInput, QuotationSection, QuotationSectionInput } from '../../types/quotation';

import type { RentalItem } from '../../types/rent';

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

export const EMPTY_QUOTATION_DRAFT_ITEM: QuotationDraftItem = { itemName: '', quantity: '1', rate: '' };

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
  return totalsFromSubtotal(subtotal, cgstPercent, sgstPercent);
}

function totalsFromSubtotal(subtotal: number, cgstPercent: string, sgstPercent: string): QuotationDraftTotals {
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

/**
 * Applies a pick from the stock item master, seeding the row's rate from the master's default.
 */
export function applyRentalItemToQuotationDraft(
  items: QuotationDraftItem[],
  index: number,
  master: RentalItem | null,
): QuotationDraftItem[] {
  const next = items.map((item, i) => {
    if (i !== index) return item;
    if (!master) return item;
    return {
      ...item,
      itemName: master.itemName,
      rate:
        item.rate === '' && master.defaultRentRate !== null
          ? String(Number(master.defaultRentRate))
          : item.rate,
    };
  });

  if (master && index === items.length - 1) {
    next.push({ ...EMPTY_QUOTATION_DRAFT_ITEM });
  }
  return next;
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
  /** A mixed quotation may leave its line items empty (it has sections instead). */
  allowEmpty = false,
): QuotationDraftItemsResult {
  const named = items.filter((item) => item.itemName.trim() !== '');
  if (named.length === 0) return allowEmpty ? { items: [], error: null } : { items: null, error: emptyMessage };
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

// ---- Section-wise quotations ------------------------------------------------------------------
// A section groups items that are priced as one amount ("EVENING STAGE" — 1,20,000). Items inside
// it are only a description and a free-text Size/Qty. Held as strings for the same reason as
// QuotationDraftItem: a half-typed amount has to be representable while the user is still typing.

export interface QuotationSectionItemDraft {
  description: string;
  sizeQty: string;
}

export interface QuotationSectionDraft {
  title: string;
  amount: string;
  items: QuotationSectionItemDraft[];
}

export function emptyQuotationSectionItem(): QuotationSectionItemDraft {
  return { description: '', sizeQty: '' };
}

export function newQuotationSectionDraft(): QuotationSectionDraft {
  return { title: '', amount: '', items: [emptyQuotationSectionItem()] };
}

/** The subtotal is the sum of the section amounts; tax is worked out exactly as for flat items. */
export function quotationSectionTotals(
  sections: QuotationSectionDraft[],
  cgstPercent: string,
  sgstPercent: string,
): QuotationDraftTotals {
  const subtotal = sections.reduce((sum, section) => sum + (Number(section.amount) || 0), 0);
  return totalsFromSubtotal(subtotal, cgstPercent, sgstPercent);
}

/** A quotation that carries both section-priced groups and priced line items: the subtotal is both added up. */
export function quotationMixedTotals(
  sections: QuotationSectionDraft[],
  items: QuotationDraftItem[],
  cgstPercent: string,
  sgstPercent: string,
): QuotationDraftTotals {
  const sectionsSubtotal = sections.reduce((sum, section) => sum + (Number(section.amount) || 0), 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
  return totalsFromSubtotal(sectionsSubtotal + itemsSubtotal, cgstPercent, sgstPercent);
}

/**
 * A priced line item shown inside the section table (the document of a quotation that mixes both): a
 * group of one, with quantity × rate in the Size/Qty column and the item's amount as the group's amount.
 */
export function flatItemAsSection(item: {
  itemName: string;
  quantity: number | string;
  rate: number | string;
  amount: number | string;
}): { title: null; amount: number; items: { description: string; sizeQty: string }[] } {
  const format = (value: number | string) => Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return {
    title: null,
    amount: Number(item.amount),
    // A quantity of 1 (the default) or 0 is left blank, like the item table's Quantity column.
    items: [
      {
        description: item.itemName,
        sizeQty: Number(item.quantity) && Number(item.quantity) !== 1 ? `${format(item.quantity)} × ${format(item.rate)}` : '',
      },
    ],
  };
}

/**
 * Applies one edit to an item of a section. Naming the trailing row spawns a fresh empty one, so
 * there is never an "Add Item" button to hunt for — the same behaviour as the flat item table.
 */
export function editQuotationSectionItem(
  section: QuotationSectionDraft,
  index: number,
  field: keyof QuotationSectionItemDraft,
  value: string,
): QuotationSectionDraft {
  const items = section.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
  if (field === 'description' && index === section.items.length - 1 && value.trim() !== '') {
    items.push(emptyQuotationSectionItem());
  }
  return { ...section, items };
}

export function removeQuotationSectionItem(section: QuotationSectionDraft, index: number): QuotationSectionDraft {
  return section.items.length > 1 ? { ...section, items: section.items.filter((_, i) => i !== index) } : section;
}

/** Turns a saved section-wise quotation back into drafts for editing (with a spare row to type into). */
export function quotationSectionsToDrafts(sections: QuotationSection[]): QuotationSectionDraft[] {
  return sections.map((section) => ({
    title: section.title ?? '',
    amount: String(Number(section.amount)),
    items: [
      ...section.items.map((item) => ({ description: item.description, sizeQty: item.sizeQty ?? '' })),
      emptyQuotationSectionItem(),
    ],
  }));
}

export type QuotationDraftSectionsResult =
  | { sections: QuotationSectionInput[]; error: null }
  | { sections: null; error: string };

/**
 * Drops sections that were never filled in and converts the rest to the API's shape, or reports the
 * first problem found. `emptyMessage` differs per caller, as for toQuotationItemsInput.
 */
export function toQuotationSectionsInput(
  sections: QuotationSectionDraft[],
  emptyMessage: string,
  /** A mixed quotation may leave its sections empty (it has line items instead). */
  allowEmpty = false,
): QuotationDraftSectionsResult {
  const filled = sections
    .map((section) => ({ ...section, items: section.items.filter((item) => item.description.trim() !== '') }))
    .filter((section) => section.items.length > 0 || section.title.trim() !== '' || section.amount.trim() !== '');

  if (filled.length === 0) return allowEmpty ? { sections: [], error: null } : { sections: null, error: emptyMessage };
  if (filled.some((section) => section.items.length === 0)) {
    return { sections: null, error: 'Add at least one item to every section.' };
  }
  if (filled.some((section) => section.amount.trim() === '' || !(Number(section.amount) >= 0))) {
    return { sections: null, error: 'Enter a valid amount for every section.' };
  }

  return {
    sections: filled.map((section) => ({
      title: section.title.trim() || undefined,
      amount: Number(section.amount),
      items: section.items.map((item) => ({
        description: item.description.trim(),
        sizeQty: item.sizeQty.trim() || undefined,
      })),
    })),
    error: null,
  };
}
