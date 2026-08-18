# End-to-end tests

Playwright suite covering the Event Management ERP. **The Rent module is deliberately out of
scope** — every other module is exercised.

## Running

Both dev servers must be reachable; Playwright starts them if they are not
(`reuseExistingServer: true`, so an already-running pair is left alone).

```bash
npm install
npx playwright install chromium   # once
npm test                          # whole suite
npm run test:headed               # watch it drive the browser
npm run report                    # open the last HTML report
node scripts/cleanup.mjs          # remove the records a run created
```

## Credentials

Nothing is hardcoded. `utils/credentials.ts` reads `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`
from `server/.env` — the same values the Prisma seed used to create the Super Admin. `auth.setup.ts`
signs in through the real login form once and saves the session to `.auth/admin.json`, which every
other spec reuses.

## Test data

Records are named with an `E2E ` prefix (usernames use `e2e_`) plus a run-unique suffix, so two runs
never collide on a unique constraint and leftovers are obvious. `scripts/cleanup.mjs` deletes them
through the REST API, which means the app's own soft-delete rules apply.

The suite runs **serially with one worker** on purpose: it drives a single shared MySQL database,
and parallel specs would see each other's rows in list assertions.

## Layout

| Path | Purpose |
| --- | --- |
| `playwright.config.ts` | Projects, reporters, both web servers |
| `tests/auth.setup.ts` | Signs in once, saves the storage state |
| `tests/*.spec.ts` | One spec per module area |
| `utils/helpers.ts` | Selectors and data helpers shared by the specs |
| `scripts/cleanup.mjs` | Removes records a run created |

## Selector notes

Three things about this UI cost real debugging time and are worth keeping in mind when adding tests:

- **MUI Selects** — the label belongs to a hidden native input, so `getByLabel(...).click()` targets
  something unclickable. Use `getByRole('combobox', { name })`.
- **MUI X DatePickers (v8)** — rendered as `role="group"` of per-section spinbuttons, with no
  textbox to `fill()`. This project's `DatePickerField` also opens the calendar on click, which
  swallows typed keys. `pickFutureDate()` drives the calendar instead.
- **Open modals** — MUI marks the page behind a modal `aria-hidden` without removing its inputs, so
  a bare `getByLabel` can resolve to two visible elements. Form fields are addressed by their `name`
  attribute, scoped to `getByRole('dialog')` (`field()` in `utils/helpers.ts`).
