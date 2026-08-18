import { expect, type Page } from '@playwright/test';

/**
 * Every record a spec creates is named with this prefix plus a run-unique suffix, so a failed run
 * leaves rows that are obvious to spot and safe to delete, and two runs never collide on a unique
 * constraint (event type names and usernames are unique per company).
 */
export const E2E_PREFIX = 'E2E';

let counter = 0;

export function uniqueName(label: string): string {
  counter += 1;
  return `${E2E_PREFIX} ${label} ${Date.now().toString(36)}${counter}`;
}

export function uniqueUsername(): string {
  counter += 1;
  return `e2e_${Date.now().toString(36)}${counter}`;
}

/** A 10-digit Indian mobile, which is what the customer/rental validators require. */
export function uniqueMobile(): string {
  const tail = String(Date.now()).slice(-9);
  return `9${tail}`;
}

/** Opens a Masters tab by its deep-link key rather than clicking through the card grid. */
export async function gotoMastersTab(page: Page, tab: 'user-groups' | 'users' | 'event-types' | 'company') {
  await page.goto(`/masters?tab=${tab}`);
  await expect(page.getByRole('table').or(page.getByText(/loading/i))).toBeVisible();
}

/** The app's data grid renders a real <table>; this waits for it to stop showing skeleton rows. */
export async function waitForTable(page: Page) {
  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  await expect(page.locator('tbody tr').first()).toBeVisible();
}

/** Finds the grid row containing the given text — the handle every row-level action hangs off. */
export function rowByText(page: Page, text: string) {
  return page.getByRole('row').filter({ hasText: text });
}

/**
 * The dialog or drawer currently on screen. Both of the app's form surfaces (MUI Dialog and the
 * shared FormDrawer) expose role="dialog", so one accessor covers both.
 */
export function dialog(page: Page) {
  return page.getByRole('dialog');
}

/**
 * A form control addressed by its `name` attribute, scoped to the open dialog.
 *
 * Labels are not usable directly here: MUI appends " *" to required labels (so `exact` never
 * matches), "Password" also matches "Confirm Password", and while a modal is open MUI marks the
 * page behind it aria-hidden without removing its inputs — which makes a bare getByLabel resolve
 * to two visible elements and trip strict mode. The `name` attribute has none of those problems.
 */
export function field(page: Page, name: string) {
  return dialog(page).locator(`[name="${name}"]`);
}

/** A button inside the open dialog. */
export function dialogButton(page: Page, name: string | RegExp) {
  return dialog(page).getByRole('button', { name });
}

/** Picks an option from a MUI Select rendered inside the open dialog. */
export async function selectOption(page: Page, label: string | RegExp, optionIndex = 0) {
  await dialog(page).getByLabel(label).click();
  await page.getByRole('option').nth(optionIndex).click();
}

/** The page's own <h1>, rendered by the shared PageHeader on every screen. */
export function pageHeading(page: Page, name: string | RegExp) {
  return page.getByRole('heading', { level: 1, name });
}

/**
 * Clicks a sidebar entry. The nav renders ListItemButtons with click handlers rather than anchors,
 * so these are buttons in the accessibility tree, not links.
 */
export async function navigateTo(page: Page, label: string) {
  await page.getByRole('button', { name: label, exact: true }).first().click();
}

/**
 * Sets a MUI X DatePicker to a date in the following month.
 *
 * Typing is not an option: MUI X v8 renders the field as role="group" of per-section spinbuttons
 * (no textbox to fill), and this project's DatePickerField opens the calendar on click — which
 * then swallows any keystrokes aimed at the sections. Driving the calendar is the path a user
 * actually takes. Stepping one month forward keeps the chosen date in the future whatever today's
 * date is, which the event-date rules require.
 */
export async function pickFutureDate(page: Page, label: string | RegExp, dayOfMonth = 15) {
  const group = page.getByRole('group', { name: label }).first();
  await group.click();

  const calendar = page.getByRole('dialog');
  await calendar.getByRole('button', { name: /next month/i }).click();
  await calendar.getByRole('gridcell', { name: String(dayOfMonth), exact: true }).first().click();

  await expect(calendar).toBeHidden();
}
