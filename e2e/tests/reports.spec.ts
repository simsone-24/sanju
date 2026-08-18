import { expect, test } from '@playwright/test';

const TABS = ['Revenue', 'Outstanding', 'Customers', 'Events'];

test.describe('Reports', () => {
  test('lands on the Reports page with its tab strip', async ({ page }) => {
    await page.goto('/reports');

    await expect(page.getByRole('heading', { level: 1, name: 'Reports' })).toBeVisible();
    for (const tab of TABS) {
      await expect(page.getByRole('tab', { name: new RegExp(tab, 'i') })).toBeVisible();
    }
  });

  for (const tab of TABS) {
    test(`the ${tab} tab renders without a client error`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto('/reports');
      await page.getByRole('tab', { name: new RegExp(tab, 'i') }).click();

      await expect(page.getByRole('tab', { name: new RegExp(tab, 'i') })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      // Either data or an explicit empty state — never a blank panel.
      await expect(page.getByRole('table').or(page.getByText(/no .*(data|records|found)/i)).first()).toBeVisible({
        timeout: 20_000,
      });
      expect(errors, `uncaught client error on the ${tab} report`).toEqual([]);
    });
  }
});
