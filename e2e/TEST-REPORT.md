# End-to-End Test Report
## Event Management ERP

| | |
| --- | --- |
| **Project** | Event Management ERP (`D:\simsone\sanju`) |
| **Test type** | End-to-end (browser-driven, full stack) |
| **Framework** | Playwright 1.62.1 |
| **Run date** | 18 August 2026, 21:13 IST (15:43 UTC) |
| **Branch / commit** | `main` @ `1e3e408` + uncommitted working tree |
| **Result** | **PASSED — 61 / 61** |

---

## 1. Executive summary

The full end-to-end suite was executed against a live stack (Vite client, Express/Prisma API,
MySQL). **All 61 tests passed**, with no failures, no flaky retries and no skipped tests. Total
wall-clock time was **4 minutes 39 seconds** on a single worker.

The run covers authentication, routing, and the Enquiries, Quotations, Orders, Payment Tracker,
Customers, Calendar, Dashboard, Reports and Masters modules — including the create/edit/delete
paths and their validation rules. The **Rent module is deliberately excluded** from this scope.

| Metric | Value |
| --- | --- |
| Tests executed | 61 |
| Passed | 61 |
| Failed | 0 |
| Flaky | 0 |
| Skipped | 0 |
| Duration | 278.8 s (4 m 39 s) |
| Workers | 1 (serial, by design) |
| Retries used | 0 |

---

## 2. Environment

| Component | Detail |
| --- | --- |
| Client | Vite dev server, `http://localhost:5173` |
| API | Express + Prisma, `http://localhost:5000/api/v1` |
| Database | MySQL (shared dev database, seeded) |
| Browser | Chromium — Desktop Chrome device profile |
| Node.js | v22.21.0 |
| OS | Windows 11 |
| Credentials | `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` read from `server/.env` — nothing hardcoded in the suite |
| Auth strategy | One real login through the UI in `auth.setup.ts`; session stored in `.auth/admin.json` and reused by every spec |

**Why one worker:** all specs drive a single shared MySQL database. Running them concurrently
would let one spec's rows appear in another spec's list assertions, so the suite is configured
`fullyParallel: false, workers: 1` for deterministic results.

---

## 3. Results by module

| Spec file | Area | Tests | Passed | Duration |
| --- | --- | ---: | ---: | ---: |
| `auth.setup.ts` | Session bootstrap | 1 | 1 | 3.6 s |
| `auth.spec.ts` | Authentication | 5 | 5 | 14.2 s |
| `navigation.spec.ts` | Routing / sidebar | 11 | 11 | 35.0 s |
| `enquiries.spec.ts` | Enquiries | 12 | 12 | 88.2 s |
| `masters.spec.ts` | Masters (Event Types, Users, User Groups) | 11 | 11 | 63.7 s |
| `quotations.spec.ts` | Quotations | 6 | 6 | 20.0 s |
| `orders.spec.ts` | Orders + Payment Tracker | 5 | 5 | 15.3 s |
| `customers-calendar-dashboard.spec.ts` | Customers, Calendar, Dashboard | 5 | 5 | 14.9 s |
| `reports.spec.ts` | Reports | 5 | 5 | 18.5 s |
| **Total** | | **61** | **61** | **278.8 s** |

---

## 4. Detailed test log

All entries below completed with status **passed**.

### 4.1 Authentication — 5 tests
| # | Test | Duration |
| ---: | --- | ---: |
| 1 | redirects an anonymous visitor to the login screen | 2.4 s |
| 2 | requires both username and password | 2.7 s |
| 3 | rejects a wrong password without revealing which field was wrong | 3.0 s |
| 4 | rejects an unknown username | 2.7 s |
| 5 | signs in with the seeded Super Admin and lands on the dashboard | 3.3 s |

### 4.2 Navigation — 11 tests
| # | Test | Duration |
| ---: | --- | ---: |
| 1 | Dashboard renders at `/` | 3.0 s |
| 2 | Enquiries renders at `/enquiries` | 3.3 s |
| 3 | Quotations renders at `/quotations` | 3.2 s |
| 4 | Orders renders at `/orders` | 3.3 s |
| 5 | Payment Tracker renders at `/payment-tracker` | 3.2 s |
| 6 | Calendar renders at `/calendar` | 3.0 s |
| 7 | Customers renders at `/customers` | 2.9 s |
| 8 | Reports renders at `/reports` | 3.2 s |
| 9 | Masters renders at `/masters` | 2.8 s |
| 10 | an unknown route falls back to the dashboard | 2.9 s |
| 11 | the sidebar reaches every module | 4.1 s |

### 4.3 Enquiries — 12 tests

**List**

| # | Test | Duration |
| ---: | --- | ---: |
| 1 | renders the grid with its toolbar | 3.4 s |
| 2 | the status filter narrows the grid through the URL | 13.2 s |
| 3 | an impossible filter shows the empty state | 3.3 s |

**Create**

| # | Test | Duration |
| ---: | --- | ---: |
| 4 | creates an enquiry for a new customer | 8.6 s |
| 5 | rejects an enquiry with no customer name, mobile, event type or date | 4.2 s |
| 6 | rejects a malformed mobile number | 7.8 s |
| 7 | requires an event type | 6.8 s |
| 8 | requires an event date | 5.6 s |
| 9 | cancelling returns to the list without creating anything | 3.8 s |

**Detail and edit**

| # | Test | Duration |
| ---: | --- | ---: |
| 10 | opens the detail page from the list | 9.1 s |
| 11 | edits an enquiry from the list | 12.8 s |
| 12 | deletes an enquiry from the list | 9.5 s |

### 4.4 Masters — 11 tests

**Event Types**

| # | Test | Duration |
| ---: | --- | ---: |
| 1 | creates, searches, edits and deletes an event type | 6.1 s |
| 2 | rejects an event type with no name | 3.7 s |

**Users**

| # | Test | Duration |
| ---: | --- | ---: |
| 3 | creates a user with a group | 6.7 s |
| 4 | creates a user with an email and city | 6.8 s |
| 5 | blocks a user whose passwords do not match | 5.7 s |
| 6 | requires a user group | 4.8 s |
| 7 | rejects a password under 8 characters | 5.9 s |
| 8 | rejects a duplicate username | 9.4 s |
| 9 | opens a user read-only from the View action | 4.6 s |

**User Groups**

| # | Test | Duration |
| ---: | --- | ---: |
| 10 | creates a user group with permissions | 5.7 s |
| 11 | requires a group name | 4.2 s |

### 4.5 Quotations — 6 tests
| # | Test | Duration |
| ---: | --- | ---: |
| 1 | the list renders with its search box | 3.1 s |
| 2 | a search with no matches shows the empty state | 3.2 s |
| 3 | the new-quotation form renders its source choice | 3.4 s |
| 4 | saving an empty quotation is refused | 3.8 s |
| 5 | cancelling returns to the list | 3.7 s |
| 6 | an unknown quotation id does not crash the app | 2.8 s |

### 4.6 Orders and Payment Tracker — 5 tests
| # | Test | Duration |
| ---: | --- | ---: |
| 1 | Orders — the list renders | 3.3 s |
| 2 | Orders — a status filter applied through the URL is accepted | 3.2 s |
| 3 | Orders — an unknown order id does not crash the app | 2.8 s |
| 4 | Payment Tracker — the list renders | 3.2 s |
| 5 | Payment Tracker — an unknown tracker id does not crash the app | 2.8 s |

### 4.7 Customers, Calendar, Dashboard — 5 tests
| # | Test | Duration |
| ---: | --- | ---: |
| 1 | Customers — the list renders with its search box | 3.0 s |
| 2 | Customers — a search with no matches shows the empty state | 3.0 s |
| 3 | Customers — an unknown customer id does not crash the app | 2.8 s |
| 4 | Calendar — renders the month view | 3.1 s |
| 5 | Dashboard — renders its summary widgets for the signed-in user | 3.0 s |

### 4.8 Reports — 5 tests
| # | Test | Duration |
| ---: | --- | ---: |
| 1 | lands on the Reports page with its tab strip | 3.3 s |
| 2 | the Revenue tab renders without a client error | 3.5 s |
| 3 | the Outstanding tab renders without a client error | 3.9 s |
| 4 | the Customers tab renders without a client error | 3.8 s |
| 5 | the Events tab renders without a client error | 4.0 s |

---

## 5. Coverage assessment

**Covered**

- Authentication: anonymous redirect, empty-field validation, wrong password, unknown username,
  successful sign-in. Error messages were checked for not leaking which field was wrong.
- Routing: every sidebar destination, plus the unknown-route fallback.
- Full CRUD with validation: Enquiries (create/edit/delete), Masters — Event Types, Users,
  User Groups.
- Read paths and empty states: Quotations, Orders, Payment Tracker, Customers, Calendar,
  Dashboard, Reports.
- Invalid-identifier handling on the detail routes of Enquiries, Quotations, Orders, Payment
  Tracker and Customers — direct verification that the string-to-integer primary-key migration
  does not produce a client crash or a 500.

**Not covered in this run**

- **Rent module** — excluded from scope by request.
- Order lifecycle transitions (status changes, task plans, documents), quotation-to-order
  conversion, and invoice/payment recording beyond list rendering.
- Role-based access control from a non-Super-Admin account; every spec runs as the seeded
  Super Admin.
- File upload paths (Multer), PDF/print output, and email/notification side effects.
- Cross-browser: Chromium only. No Firefox, WebKit or mobile viewport run.

---

## 6. Test data and cleanup

Records created by the suite are prefixed `E2E ` (usernames `e2e_`) and carry a run-unique suffix,
so repeated runs never collide on a unique constraint and any leftovers are identifiable at a
glance. `node scripts/cleanup.mjs` removes them through the REST API, which means the
application's own soft-delete rules apply rather than raw SQL deletion.

---

## 7. Reproducing this run

```bash
cd e2e
npm install
npx playwright install chromium   # once
npm test                          # full suite
npm run report                    # open the HTML report
node scripts/cleanup.mjs          # remove records this run created
```

Both dev servers must be reachable; Playwright starts them if they are not
(`reuseExistingServer: true`). Artefacts from the run:

| Artefact | Path |
| --- | --- |
| HTML report | `e2e/playwright-report/index.html` |
| JSON results | `e2e/test-results/results.json` |
| Saved session | `e2e/.auth/admin.json` |

Traces, screenshots and video are captured **only on failure**; this run produced none.

---

## 8. Conclusion and recommendations

The application passes every scenario in scope. No defects were raised by this run.

Recommended next steps, in priority order:

1. **Extend to the order lifecycle** — status transitions, quotation-to-order conversion and
   payment recording are the highest-value business flows still untested.
2. **Add a non-admin role run** to prove RBAC is enforced server-side, not only hidden in the UI.
3. **Bring the Rent module into scope** once its feature work settles.
4. **Wire the suite into CI** — the config already sets `forbidOnly` and one retry under `CI`.
5. **Add a seeded, isolated test database** so the suite can drop `workers: 1` and run in parallel.
