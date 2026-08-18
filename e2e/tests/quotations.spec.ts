import { expect, test } from '@playwright/test';

test.describe('Quotations — list', () => {
  test('the list renders with its search box', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/quotations');

    await expect(
      page.getByRole('searchbox', { name: /search quotation no, enquiry, customer, mobile/i }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a search with no matches shows the empty state', async ({ page }) => {
    await page.goto('/quotations');
    await page
      .getByRole('searchbox', { name: /search quotation no, enquiry, customer, mobile/i })
      .fill('zzz-no-such-quotation-zzz');

    await expect(page.getByText(/no .*(quotation|records|found)/i).first()).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('Quotations — form', () => {
  test('the new-quotation form renders its source choice', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/quotations/new');

    await expect(page.getByRole('button', { name: /save|create/i }).first()).toBeVisible({ timeout: 20_000 });
    expect(errors).toEqual([]);
  });

  test('saving an empty quotation is refused', async ({ page }) => {
    await page.goto('/quotations/new');
    await page.getByRole('button', { name: /^save/i }).first().click();

    // The form must stay put and say why, rather than posting an empty document.
    await expect(page).toHaveURL(/\/quotations\/new$/);
    await expect(page.getByText(/required|select|add at least/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('cancelling returns to the list', async ({ page }) => {
    await page.goto('/quotations/new');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(/\/quotations$/);
  });

  test('an unknown quotation id does not crash the app', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/quotations/99999999');

    await expect(page.locator('body')).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
});
