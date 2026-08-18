import { expect, test } from '@playwright/test';

test.describe('Customers', () => {
  test('the list renders with its search box', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/customers');

    await expect(page.getByRole('heading', { level: 1, name: 'Customers' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: /search by name, mobile, email/i })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a search with no matches shows the empty state', async ({ page }) => {
    await page.goto('/customers');
    await page.getByRole('searchbox', { name: /search by name, mobile, email/i }).fill('zzz-no-such-customer-zzz');

    // The grid shows its rich empty state rather than a "no records" line.
    await expect(
      page.getByText(/customer list is waiting|no .*(customers|records|found)/i).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('an unknown customer id does not crash the app', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/customers/99999999');

    await expect(page.locator('body')).not.toBeEmpty();
    expect(errors).toEqual([]);
  });
});

test.describe('Calendar', () => {
  test('renders the month view', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/calendar');

    await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe('Dashboard', () => {
  test('renders its summary widgets for the signed-in user', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    // The subtitle greets the signed-in user by name and group.
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    expect(errors).toEqual([]);
  });
});
