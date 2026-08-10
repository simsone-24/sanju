export function formatCurrency(value: string | number): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(
    amount,
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Date plus clock time ("05 Aug 2026, 10:15 AM") — for audit fields where the time of day is part
// of the record, such as Order Details' Created On and Last Updated.
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// How near an event is, for list rows that are scanned by date ("Today", "In 4 days", "12d ago").
// `urgent` marks the ones worth calling out in colour — today, tomorrow, or inside the week.
export function eventProximity(value: string): { text: string; urgent: boolean } {
  const target = new Date(value);
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((startOfTarget - startOfToday) / 86_400_000);

  if (days < 0) return { text: `${Math.abs(days)}d ago`, urgent: false };
  if (days === 0) return { text: 'Today', urgent: true };
  if (days === 1) return { text: 'Tomorrow', urgent: true };
  return { text: `In ${days} days`, urgent: days <= 7 };
}

// Only the company logo is served publicly (server/src/app.ts mounts express.static at
// /uploads/company); every other upload requires an authenticated download endpoint. VITE_API_URL
// is the versioned API base (…/api/v1) — static assets live one level up, at the bare origin.
export function getPublicAssetUrl(relativePath: string): string {
  const origin = import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}/uploads/${relativePath}`;
}
