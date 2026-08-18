import { expect, test as setup } from '@playwright/test';
import { STORAGE_STATE } from '../playwright.config';
import { ADMIN } from '../utils/credentials';

// Signs in through the real form rather than seeding a token, so the login path itself is
// exercised before anything else runs. The resulting localStorage (zustand's "sanju-auth") is
// reused by every other spec.
setup('authenticate as Super Admin', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Username').fill(ADMIN.username);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
  await expect(page.getByRole('button', { name: /account|admin|profile/i }).or(page.locator('header'))).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
