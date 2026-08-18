/**
 * Form controls and URL query strings carry ids as text — a native <select> option value is always
 * a DOM string, and '' is the codebase's "nothing chosen" sentinel — while the API models every id
 * as an auto-increment integer. These convert at that boundary so pages can keep the string-based
 * form state the rest of the client assumes.
 */

/**
 * An optional id: '' / undefined / anything non-numeric all mean "no filter, omit it".
 *
 * Accepts a number as well as a string because MUI types `event.target.value` as a string while
 * handing back whatever the chosen <MenuItem value> actually held — which is a numeric id here.
 */
export function toOptionalId(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

/** A required id, for fields the form's own validation has already proven non-empty. */
export function toId(value: string): number {
  return Number(value);
}

/** The reverse trip: seeding string-based form state or <select> options from a record's id. */
export function fromId(id: number | null | undefined): string {
  return id === null || id === undefined ? '' : String(id);
}
