import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

// Credentials come from the server's own .env — the same values the seed used to create the Super
// Admin — so nothing is hardcoded here (CLAUDE.md §Security: "Store secrets only in environment
// variables").
loadEnv({ path: path.resolve(__dirname, '../server/.env') });

export const APP_URL = process.env.E2E_APP_URL ?? 'http://localhost:5173';
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:5000/api/v1';
export const STORAGE_STATE = path.resolve(__dirname, '.auth/admin.json');

export default defineConfig({
  testDir: './tests',
  // The suite drives one shared MySQL database. Running specs concurrently would let one spec's
  // records land in another's list assertions, so the whole run is serial and deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },

  projects: [
    // Signs in once through the real login form and saves the session for every other spec.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],

  // Both dev servers are reused when already up, and started on demand when they are not.
  webServer: [
    {
      command: 'npm run dev',
      cwd: path.resolve(__dirname, '../server'),
      // An authenticated route with no token answers 401 — a status Playwright accepts as "up",
      // and one that proves the API and its middleware are actually serving, not just the port.
      url: `${API_URL}/users/options`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: path.resolve(__dirname, '../client'),
      url: APP_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
