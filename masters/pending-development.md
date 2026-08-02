# Masters v1.1 — Pending Development

Status of work deferred after implementing `masters/user.md` v1.1 (User Groups + Users, permission
catalog, username login).

Grouped by why it is pending, not by module:

1. **Follow-ups created by this change** — work the Masters rework directly requires next.
2. **Blocked on a feature that does not exist yet** — permissions user.md lists that nothing can
   enforce until the underlying feature is built.
3. **Future enhancements** — user.md's own deferred list.
4. **Pre-existing gaps** — noticed while working, not caused by this change.

---

# 1. Follow-ups created by this change

## 1.1 Task Templates need their home in the Order module

user.md removed Task Templates from Masters because "Task Templates will be managed inside the Order
Module". The Masters screen and its client code are gone, but the backend module
(`server/src/modules/task-templates`) and the `task_templates` table were deliberately kept so no
data is lost — they are currently unreachable from the UI.

Pending: design and build the Order-module surface (`md files/task plan/scope.md` lists Task
Templates as a future enhancement of Task Plan), then either reuse the existing API or fold it into
the Task Plan module and retire the old one.

## 1.2 Two migrated accounts have no mobile number

Mobile is mandatory now (user.md §Validation Rules), but it was optional before. The migration left
existing rows blank rather than inventing a number.

Pending: open `admin` and `sanju` in Masters → Users and fill in the real numbers. The form will not
save until one is supplied, so this resolves itself on the next edit of each account.

## 1.3 Permission review after the role → group migration

Every role became a group with equivalent access, but two new permissions could only be inferred:

| New permission | Migrated from | Consequence |
|---|---|---|
| Enquiries → Convert to Order | Orders → Create | A group that could edit enquiries but not create orders can no longer confirm an enquiry into an order — e.g. the seeded **Sales Executive**. |
| Payment Tracker → Print Receipt | Payment Tracker → View | Anyone who could see payments can print the invoice, which matches the old behaviour but is broader than most businesses want. |

Pending: an administrator walks each group through Masters → User Groups and confirms the new
action-level boxes (Assign, Change Status, Convert to Order, Cancel Order, Complete Event, Update
Checklist, Print Receipt) match the business's intent.

## 1.4 Root `Account` file still lists email logins

`/Account` documents the demo accounts by email address. Sign-in is by username now (`admin@sanju.local`
→ `admin`, and so on for the rest).

Pending: update that file, or drop it in favour of the seed's documented credentials.

## 1.5 Local `.env` needs the new seed variables

`SEED_ADMIN_USERNAME` and `SEED_ADMIN_MOBILE` are now required by `prisma/seed.ts`, and
`SEED_ADMIN_EMAIL` became optional. `.env.example` is updated; each developer's own `.env` is not.

## 1.6 Permission changes do not reach an open browser tab

The server resolves permissions on every request, so a change applies immediately to the API. The
frontend, however, keeps the profile it received at login until the page is reloaded, so a user whose
access was just changed can still see buttons that will now fail.

Pending: refetch `/auth/me` on a timer or on window focus, or push a "your permissions changed,
please reload" notice.

## 1.7 Profile photos are only visible inside the user form

Upload, storage and authenticated retrieval are built (`POST/GET /users/:id/photo`), and the form
previews the photo. Nothing else displays it.

Pending: show it on the sidebar account panel, in Created By / Assigned To cells, and in activity
trails — each of those renders initials today (`utils/avatar.ts`).

## 1.8 No status filter on the User Groups list

`GET /user-groups` accepts `status`, and the Users list accepts `userGroupId` and `isActive`. The
Masters screens only expose a search box.

Pending: surface those filters in the UI if the group/user count grows enough to need them.

---

# 2. Blocked on a feature that does not exist yet

The permission catalog (`server/src/modules/permissions/catalog.ts`) deliberately lists only actions
the application actually enforces — a checkbox that gates nothing would promise access control the
app does not perform. These actions from user.md are therefore **not** in the catalog yet. Each one
becomes a single catalog entry the moment the underlying feature ships.

| Module | Action in user.md | Missing feature |
|---|---|---|
| Enquiries | Delete | No delete endpoint — enquiries are never removed today. |
| Enquiries | Print | No enquiry print/PDF view. |
| Quotations | Delete | No delete endpoint (only quotation *images* can be deleted). |
| Orders | Print | The order page's Print button prints the linked quotation PDF, so it is covered by Quotations → Print. A dedicated order printout would need its own action. |
| Payment Tracker | Delete Payment | Payments are append-only; there is no delete endpoint. |
| Customers | Create / Edit / Delete | Customers are created and updated by the enquiry workflow; there is no manual customer form. |
| Masters | Export | Deliberately absent: Masters lists have no business export requirement. Add it if that changes. |
| Task Management | Assign task to a user | Task items have no assignee field (`md files/task plan/scope.md` defers team allocation). |

---

# 3. Future enhancements (user.md §Future Enhancements)

Listed in the doc as out of scope for v1.1. Rough order of value first:

| # | Enhancement | Notes for when it is picked up |
|---|---|---|
| 1 | **Clone User Group** | Cheapest win: `POST /user-groups` already accepts a full permission set, so cloning is a UI action that pre-fills the create dialog from an existing group. |
| 2 | **Copy Permissions from Existing Group** | Same endpoint; a "copy from…" picker inside the permission editor. |
| 3 | **Permission Templates** | A saved, reusable permission set independent of any one group. Needs a small table; the catalog itself needs no change. |
| 4 | **Audit Log for Permission Changes** | Half done — `activity_logs` already records `USER_GROUPS / UPDATE_PERMISSIONS` with the full submitted set as metadata, and `USERS / UPDATE_PERMISSIONS` for overrides. What is missing is a screen to read that history. |
| 5 | **Login History** | Every login already writes an `AUTH / LOGIN` activity row. Pending: a last-login column on the Users list and a per-user history view. |
| 6 | **Password Expiry Policy** | Needs `password_changed_at` on `users`, a policy setting, and a forced-change screen at login. |
| 7 | **Two-Factor Authentication (2FA)** | Affects the login flow and token issuing; largest of the set. |
| 8 | **IP-based Login Restrictions** | Per-group or per-user allow-list checked in `login()` and in `authenticate`. |
| 9 | **Department-wise Groups** | Grouping metadata on `user_groups`. |
| 10 | **Branch-wise Permissions** | The big one: permissions become scoped by branch, which changes the grant key from (module, action) to (module, action, scope) and touches every `authorize()` call. Worth designing before anything else in this list is built on top of it. |

---

# 4. Pre-existing gaps worth scheduling

Not introduced by this change, but adjacent to it:

- **No self-service password change.** A signed-in user cannot change their own password; only an
  administrator can reset it from Masters → Users. There is also no forgot-password flow.
- **No self-lockout guard.** Nothing stops an administrator removing their own Masters access, or
  deleting their own account, and locking themselves out. user.md does not specify a rule — a
  decision is needed before adding one (e.g. "the last user with Masters → Edit cannot lose it").
- **CSV export is current-page only.** `components/DataTable.tsx` exports the loaded page rather than
  the full filtered result set; real server-side export remains a separate backend item. The Export
  permission gates the button either way.
- **The orders-side conversion flow has no UI.** `GET /orders/eligible-enquiries` and
  `POST /orders/convert` exist and are permission-gated, but the app converts by moving an enquiry to
  Order Confirmed. Either build the orders-side screen or retire the endpoints.
- **No automated tests.** The repository has no test suite. Permission resolution
  (`permissions/service.ts`), the `authorize` / `authorizeWhen` / `authorizeAny` middleware, and the
  workflow transition rules are the highest-value places to start, being both security-critical and
  pure functions that are cheap to test.
