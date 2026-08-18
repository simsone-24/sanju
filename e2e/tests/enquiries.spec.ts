import { expect, test, type Page } from '@playwright/test';
import { pickFutureDate, rowByText, uniqueMobile, uniqueName } from '../utils/helpers';

/**
 * Fills the minimum a new-customer enquiry needs and saves it.
 *
 * The event type is a MUI Select, whose clickable element is the combobox — the label belongs to
 * the hidden native input behind it, which cannot be clicked. A successful save returns to the
 * list with the new row highlighted (EnquiryFormPage's leaveForm), not to a detail page.
 */
async function createEnquiry(page: Page, customerName: string) {
  await page.goto('/enquiries/new');
  await expect(page.getByRole('button', { name: 'Save Enquiry' })).toBeVisible();

  await page.locator('[name="customerName"]').fill(customerName);
  await page.locator('[name="mobile"]').fill(uniqueMobile());

  await page.getByRole('combobox', { name: /event type/i }).click();
  await page.getByRole('option').first().click();

  await pickFutureDate(page, /event date/i);

  await page.getByRole('button', { name: 'Save Enquiry' }).click();
  await expect(page).toHaveURL(/\/enquiries$/, { timeout: 20_000 });
  await expect(rowByText(page, customerName)).toBeVisible({ timeout: 20_000 });
}

test.describe('Enquiries — list', () => {
  test('renders the grid with its toolbar', async ({ page }) => {
    await page.goto('/enquiries');

    await expect(page.getByRole('button', { name: 'New Enquiry' }).first()).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('the status filter narrows the grid through the URL', async ({ page }) => {
    const name = uniqueName('Enq Filter');
    await createEnquiry(page, name);

    // A new enquiry is PENDING, so it belongs to that filter and not to ORDER_LOST.
    await page.goto('/enquiries?status=PENDING');
    await expect(rowByText(page, name)).toBeVisible({ timeout: 20_000 });

    await page.goto('/enquiries?status=ORDER_LOST');
    await expect(rowByText(page, name)).toHaveCount(0);
  });

  test('an impossible filter shows the empty state', async ({ page }) => {
    await page.goto('/enquiries?status=ORDER_LOST&eventFrom=1990-01-01&eventTo=1990-01-02');

    await expect(page.getByText(/no .*(found|records|enquir)/i).first()).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('Enquiries — create', () => {
  test('creates an enquiry for a new customer', async ({ page }) => {
    const name = uniqueName('Enq New');
    await createEnquiry(page, name);

    await expect(rowByText(page, name)).toBeVisible();
  });

  test('rejects an enquiry with no customer name, mobile, event type or date', async ({ page }) => {
    await page.goto('/enquiries/new');
    await page.getByRole('button', { name: 'Save Enquiry' }).click();

    // Still on the form, with field errors shown rather than a silent no-op.
    await expect(page).toHaveURL(/\/enquiries\/new$/);
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('rejects a malformed mobile number', async ({ page }) => {
    await page.goto('/enquiries/new');

    await page.locator('[name="customerName"]').fill(uniqueName('Bad Mobile'));
    await page.locator('[name="mobile"]').fill('12345');
    await page.getByRole('combobox', { name: /event type/i }).click();
    await page.getByRole('option').first().click();
    await pickFutureDate(page, /event date/i);
    await page.getByRole('button', { name: 'Save Enquiry' }).click();

    await expect(page).toHaveURL(/\/enquiries\/new$/);
    await expect(page.getByText(/valid.*(mobile|phone)|10-digit/i).first()).toBeVisible();
  });

  test('requires an event type', async ({ page }) => {
    await page.goto('/enquiries/new');

    await page.locator('[name="customerName"]').fill(uniqueName('No Type'));
    await page.locator('[name="mobile"]').fill(uniqueMobile());
    await pickFutureDate(page, /event date/i);
    await page.getByRole('button', { name: 'Save Enquiry' }).click();

    await expect(page).toHaveURL(/\/enquiries\/new$/);
    await expect(page.getByText(/select an event type/i)).toBeVisible();
  });

  test('requires an event date', async ({ page }) => {
    await page.goto('/enquiries/new');

    await page.locator('[name="customerName"]').fill(uniqueName('No Date'));
    await page.locator('[name="mobile"]').fill(uniqueMobile());
    await page.getByRole('combobox', { name: /event type/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Save Enquiry' }).click();

    await expect(page).toHaveURL(/\/enquiries\/new$/);
    await expect(page.getByText(/event date is required/i)).toBeVisible();
  });

  test('cancelling returns to the list without creating anything', async ({ page }) => {
    await page.goto('/enquiries/new');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(/\/enquiries$/);
  });
});

test.describe('Enquiries — detail and edit', () => {
  test('opens the detail page from the list', async ({ page }) => {
    const name = uniqueName('Enq Detail');
    await createEnquiry(page, name);

    await rowByText(page, name).getByRole('button', { name: 'View enquiry' }).click();

    await expect(page).toHaveURL(/\/enquiries\/\d+$/, { timeout: 20_000 });
    await expect(page.getByText(/ENQ-\d{4}-\d{5}/).first()).toBeVisible();
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test('edits an enquiry from the list', async ({ page }) => {
    const name = uniqueName('Enq Edit');
    await createEnquiry(page, name);

    await rowByText(page, name).getByRole('button', { name: 'Edit enquiry' }).click();
    await expect(page).toHaveURL(/\/enquiries\/\d+\/edit$/, { timeout: 20_000 });

    const venue = page.locator('[name="venue"]');
    await expect(venue).toBeVisible();
    await venue.fill('E2E Updated Venue');
    await page.getByRole('button', { name: 'Update Enquiry' }).click();

    await expect(page).toHaveURL(/\/enquiries$/, { timeout: 20_000 });
    await rowByText(page, name).getByRole('button', { name: 'View enquiry' }).click();
    await expect(page.getByText('E2E Updated Venue').first()).toBeVisible({ timeout: 20_000 });
  });

  test('deletes an enquiry from the list', async ({ page }) => {
    const name = uniqueName('Enq Delete');
    await createEnquiry(page, name);

    await rowByText(page, name).getByRole('button', { name: 'Delete enquiry' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /yes|delete|confirm/i }).click();

    await expect(rowByText(page, name)).toHaveCount(0, { timeout: 20_000 });
  });
});
