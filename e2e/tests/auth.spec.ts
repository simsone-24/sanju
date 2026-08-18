import { expect, test } from '@playwright/test';
import { ADMIN } from '../utils/credentials';

// These run without the saved session so the login screen itself is reachable.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('redirects an anonymous visitor to the login screen', async ({ page }) => {
    await page.goto('/enquiries');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('requires both username and password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText(/required/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rejects a wrong password without revealing which field was wrong', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(ADMIN.username);
    await page.getByLabel('Password').fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rejects an unknown username', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('nobody_here_at_all');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signs in with the seeded Super Admin and lands on the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(ADMIN.username);
    await page.getByLabel('Password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  });
});
