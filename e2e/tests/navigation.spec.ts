import { expect, test } from '@playwright/test';

/**
 * Every module the Super Admin can reach, minus Rent (excluded from this suite by request).
 * Each entry is checked for its route and for a rendered page heading, which is the cheapest
 * proof that the screen mounted rather than throwing.
 */
const MODULES = [
  { path: '/', label: 'Dashboard' },
  { path: '/enquiries', label: 'Enquiries' },
  { path: '/quotations', label: 'Quotations' },
  { path: '/orders', label: 'Orders' },
  { path: '/payment-tracker', label: 'Payment Tracker' },
  { path: '/calendar', label: 'Calendar' },
  { path: '/customers', label: 'Customers' },
  { path: '/reports', label: 'Reports' },
  { path: '/masters', label: 'Masters' },
] as const;

test.describe('Navigation', () => {
  for (const module of MODULES) {
    test(`${module.label} renders at ${module.path}`, async ({ page }) => {
      const failures: string[] = [];
      page.on('pageerror', (error) => failures.push(error.message));

      await page.goto(module.path);

      await expect(page).toHaveURL(new RegExp(`${module.path.replace('/', '\\/')}$`));
      await expect(page.getByRole('heading').first()).toBeVisible();
      expect(failures, `uncaught client error on ${module.path}`).toEqual([]);
    });
  }

  test('an unknown route falls back to the dashboard', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  });

  test('the sidebar reaches every module', async ({ page }) => {
    await page.goto('/');

    for (const label of ['Enquiries', 'Quotations', 'Orders', 'Customers', 'Reports', 'Calendar']) {
      await page.getByRole('button', { name: label, exact: true }).first().click();
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });
});
