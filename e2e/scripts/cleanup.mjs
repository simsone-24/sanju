/**
 * Removes the records an e2e run leaves behind.
 *
 * Every record the suite creates is named with the "E2E " prefix (or an "e2e_" username), so this
 * only ever deletes rows the tests themselves made. It goes through the REST API rather than the
 * database so the same soft-delete and permission rules the app enforces apply here too.
 *
 * Usage: node scripts/cleanup.mjs
 */
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, '../../server/.env') });

const API = process.env.E2E_API_URL ?? 'http://localhost:5000/api/v1';

async function login() {
  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.SEED_ADMIN_USERNAME?.trim().toLowerCase(),
      password: process.env.SEED_ADMIN_PASSWORD,
    }),
  });
  if (!response.ok) throw new Error(`Login failed (${response.status}).`);
  return (await response.json()).data.accessToken;
}

async function purge(token, resource, matches, label) {
  const headers = { Authorization: `Bearer ${token}` };
  const listed = await fetch(`${API}/${resource}?page=1&limit=200`, { headers });
  if (!listed.ok) {
    console.log(`skip ${label}: list returned ${listed.status}`);
    return 0;
  }

  const records = (await listed.json()).data ?? [];
  let removed = 0;
  for (const record of records.filter(matches)) {
    const deleted = await fetch(`${API}/${resource}/${record.id}`, { method: 'DELETE', headers });
    if (deleted.ok) removed += 1;
    else console.log(`  could not delete ${label} ${record.id}: ${deleted.status}`);
  }
  console.log(`${label}: removed ${removed} of ${records.length} listed`);
  return removed;
}

const token = await login();

// Enquiries first — they reference event types, which cannot be deleted while in use.
await purge(token, 'enquiries', (r) => /^E2E /.test(r.prospectName ?? r.customer?.customerName ?? ''), 'enquiries');
await purge(token, 'users', (r) => /^e2e_/.test(r.username ?? ''), 'users');
await purge(token, 'event-types', (r) => /^E2E /.test(r.eventName ?? ''), 'event types');
await purge(token, 'user-groups', (r) => /^E2E /.test(r.groupName ?? ''), 'user groups');

console.log('\nCleanup complete.');
