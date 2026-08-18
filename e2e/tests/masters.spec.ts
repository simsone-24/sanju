import { expect, test, type Page } from '@playwright/test';
import {
  dialog,
  dialogButton,
  field,
  gotoMastersTab,
  rowByText,
  selectOption,
  uniqueMobile,
  uniqueName,
  uniqueUsername,
} from '../utils/helpers';

test.describe('Masters — Event Types', () => {
  test('creates, searches, edits and deletes an event type', async ({ page }) => {
    const name = uniqueName('Event');
    const renamed = `${name} Renamed`;

    await gotoMastersTab(page, 'event-types');

    await page.getByRole('button', { name: 'Add Event Type' }).click();
    await field(page, 'eventName').fill(name);
    await field(page, 'displayOrder').fill('99');
    await dialogButton(page, 'Save').click();
    await expect(rowByText(page, name)).toBeVisible();

    // Search narrows the grid to the new row.
    await page.getByRole('searchbox', { name: /search by event name/i }).fill(name);
    await expect(rowByText(page, name)).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);

    await rowByText(page, name).getByRole('button', { name: 'Edit' }).click();
    await field(page, 'eventName').fill(renamed);
    await dialogButton(page, 'Save').click();
    await expect(rowByText(page, renamed)).toBeVisible();

    await rowByText(page, renamed).getByRole('button', { name: 'Delete' }).click();
    await dialogButton(page, /yes|delete|confirm/i).click();
    await expect(rowByText(page, renamed)).toHaveCount(0);
  });

  test('rejects an event type with no name', async ({ page }) => {
    await gotoMastersTab(page, 'event-types');
    await page.getByRole('button', { name: 'Add Event Type' }).click();
    await dialogButton(page, 'Save').click();

    await expect(dialog(page).getByText(/required/i).first()).toBeVisible();
    await expect(dialog(page)).toBeVisible();
  });
});

test.describe('Masters — Users', () => {
  async function openAddUser(page: Page) {
    await gotoMastersTab(page, 'users');
    await page.getByRole('button', { name: 'Add User' }).click();
    await expect(dialog(page)).toBeVisible();
  }

  async function fillBasics(page: Page, fullName: string, username: string) {
    await field(page, 'fullName').fill(fullName);
    await field(page, 'username').fill(username);
    await field(page, 'mobile').fill(uniqueMobile());
  }

  test('creates a user with a group', async ({ page }) => {
    const fullName = uniqueName('User');
    const username = uniqueUsername();

    await openAddUser(page);
    await fillBasics(page, fullName, username);
    await field(page, 'password').fill('password123');
    await field(page, 'confirmPassword').fill('password123');

    // The regression this suite was written around: the User Group select must submit a value the
    // form's schema accepts, not the raw numeric id.
    await selectOption(page, 'User Group');
    await dialogButton(page, 'Save').click();

    await expect(dialog(page)).toBeHidden({ timeout: 20_000 });
    await expect(rowByText(page, username)).toBeVisible();
  });

  test('creates a user with an email and city', async ({ page }) => {
    const username = uniqueUsername();

    await openAddUser(page);
    await fillBasics(page, uniqueName('Full'), username);
    await field(page, 'password').fill('password123');
    await field(page, 'confirmPassword').fill('password123');
    await field(page, 'email').fill(`${username}@example.com`);
    await field(page, 'city').fill('Madurai');
    await selectOption(page, 'User Group');
    await dialogButton(page, 'Save').click();

    await expect(dialog(page)).toBeHidden({ timeout: 20_000 });
    await expect(rowByText(page, username)).toBeVisible();
  });

  test('blocks a user whose passwords do not match', async ({ page }) => {
    await openAddUser(page);
    await fillBasics(page, uniqueName('Mismatch'), uniqueUsername());
    await field(page, 'password').fill('password123');
    await field(page, 'confirmPassword').fill('different123');
    await selectOption(page, 'User Group');
    await dialogButton(page, 'Save').click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    await expect(dialog(page)).toBeVisible();
  });

  test('requires a user group', async ({ page }) => {
    await openAddUser(page);
    await fillBasics(page, uniqueName('NoGroup'), uniqueUsername());
    await field(page, 'password').fill('password123');
    await field(page, 'confirmPassword').fill('password123');
    await dialogButton(page, 'Save').click();

    await expect(page.getByText(/user group is required/i)).toBeVisible();
    await expect(dialog(page)).toBeVisible();
  });

  test('rejects a password under 8 characters', async ({ page }) => {
    await openAddUser(page);
    await fillBasics(page, uniqueName('ShortPw'), uniqueUsername());
    await field(page, 'password').fill('short');
    await field(page, 'confirmPassword').fill('short');
    await selectOption(page, 'User Group');
    await dialogButton(page, 'Save').click();

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test('rejects a duplicate username', async ({ page }) => {
    const username = uniqueUsername();

    await openAddUser(page);
    await fillBasics(page, uniqueName('First'), username);
    await field(page, 'password').fill('password123');
    await field(page, 'confirmPassword').fill('password123');
    await selectOption(page, 'User Group');
    await dialogButton(page, 'Save').click();
    await expect(dialog(page)).toBeHidden({ timeout: 20_000 });

    // The same username again — the server's uniqueness rule must surface as a form error.
    await page.getByRole('button', { name: 'Add User' }).click();
    await fillBasics(page, uniqueName('Second'), username);
    await field(page, 'password').fill('password123');
    await field(page, 'confirmPassword').fill('password123');
    await selectOption(page, 'User Group');
    await dialogButton(page, 'Save').click();

    await expect(page.getByText(/already (exists|in use)/i)).toBeVisible();
    await expect(dialog(page)).toBeVisible();
  });

  test('opens a user read-only from the View action', async ({ page }) => {
    await gotoMastersTab(page, 'users');
    await page.locator('tbody tr').first().getByRole('button', { name: 'View' }).click();

    await expect(dialog(page)).toBeVisible();
    await expect(dialogButton(page, 'Close')).toBeVisible();
    await expect(dialogButton(page, 'Save')).toHaveCount(0);
  });
});

test.describe('Masters — User Groups', () => {
  test('creates a user group with permissions', async ({ page }) => {
    const groupName = uniqueName('Group');

    await gotoMastersTab(page, 'user-groups');
    await page.getByRole('button', { name: 'Add User Group' }).click();

    await field(page, 'groupName').fill(groupName);
    await dialog(page).getByRole('checkbox').first().check();
    await dialogButton(page, 'Save').click();

    await expect(dialog(page)).toBeHidden({ timeout: 20_000 });
    await expect(rowByText(page, groupName)).toBeVisible();
  });

  test('requires a group name', async ({ page }) => {
    await gotoMastersTab(page, 'user-groups');
    await page.getByRole('button', { name: 'Add User Group' }).click();
    await dialogButton(page, 'Save').click();

    await expect(page.getByText(/group name is required/i)).toBeVisible();
    await expect(dialog(page)).toBeVisible();
  });
});
