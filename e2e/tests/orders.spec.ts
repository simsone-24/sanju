import { expect, test } from '@playwright/test';

test.describe('Orders', () => {
  test('the list renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/orders');

    await expect(page.getByRole('table').or(page.getByText(/no .*(orders|records|found)/i)).first()).toBeVisible({
      timeout: 20_000,
    });
    expect(errors).toEqual([]);
  });

  test('a status filter applied through the URL is accepted', async ({ page }) => {
    await page.goto('/orders?status=CONFIRMED');

    await expect(page.getByRole('table').or(page.getByText(/no .*(orders|records|found)/i)).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('an unknown order id does not crash the app', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/orders/99999999');

    // Either a "not found" message or a redirect — but never a blank page or an uncaught error.
    await expect(page.locator('body')).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
});

test.describe('Payment Tracker', () => {
  test('the list renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/payment-tracker');

    await expect(page.getByRole('heading', { level: 1, name: 'Payment Tracker' })).toBeVisible();
    await expect(
      page.getByRole('table').or(page.getByText(/no .*(orders|records|found)/i)).first(),
    ).toBeVisible({ timeout: 20_000 });
    expect(errors).toEqual([]);
  });

  test('an unknown tracker id does not crash the app', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/payment-tracker/99999999');

    await expect(page.locator('body')).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
});
