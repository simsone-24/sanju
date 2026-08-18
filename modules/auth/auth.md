# Auth

## Purpose

Signs a user in, keeps the session alive, and returns the profile plus the effective permission set
the client uses to render its UI. The only module with routes reachable without a token.

## Source Files

```
server/src/modules/auth/
  controller.ts   routes.ts   service.ts   repository.ts   types.ts   validation.ts
server/src/utils/jwt.ts
server/src/middleware/authenticate.ts
```

## Data

Reads `users`, `user_groups`, `user_group_permissions`, `user_permission_overrides` and `companies`.
Writes `activity_logs` (`LOGIN`, `LOGOUT`). Owns no table of its own.

Tokens are stateless JWTs — nothing is persisted server side.

| Token | Payload | Secret / lifetime |
| --- | --- | --- |
| Access | `sub` (user id), `companyId`, `userGroupId`, `userGroupName` | `JWT_SECRET` / `JWT_ACCESS_EXPIRES_IN` |
| Refresh | `sub` (user id) | `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` |

## API

Base path `/api/v1/auth`.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/login` | public | `{ username, password }` → access token, refresh token and profile. |
| `POST` | `/refresh-token` | public | `{ refreshToken }` → a fresh access + refresh token pair. |
| `POST` | `/logout` | authenticated | Records the logout in the activity log. |
| `GET` | `/me` | authenticated | Current profile with the effective permission list. |

### Profile payload

```
id, fullName, username, email, mobile, city, profilePhoto,
userGroup: { id, groupName },
company:   { id, companyName, logo },
permissions: [{ module, actions[] }]
```

## Business Rules

- Users sign in with their **username**, not their email. The submitted username is trimmed and
  lowercased so casing at the prompt never matters.
- Passwords are verified with `bcrypt.compare` against `users.password_hash`.
- An inactive user cannot log in, cannot refresh, and cannot resolve `/me`.
- A missing account, a wrong password and a disabled account all return the same
  `Invalid username or password.` message — the form never reveals which one it was.
- Effective permissions are the **union** of the user's group permissions and their personal
  overrides, filtered through the permission catalog (see [Permissions](../permissions/permissions.md)).
- Logout is a client-side token discard; the server only writes the audit entry, because the tokens
  are stateless.

## Frontend

- `client/src/pages/auth/LoginPage.tsx`
- `client/src/services/authService.ts`, `client/src/api/client.ts` (attaches the bearer token and
  performs the refresh round trip)
- `client/src/routes/ProtectedRoute.tsx`

## Related Modules

[Users](../users/users.md) · [User Groups](../user-groups/user-groups.md) · [Permissions](../permissions/permissions.md)
