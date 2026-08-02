// Deterministic avatar identity for people shown without a profile picture (customers, assigned
// staff). The same name always produces the same initials and the same hue, so a row's avatar is
// recognisable at a glance while scanning a list.

// Hues picked from the app's palette family (blue/violet/cyan/emerald/amber/rose/indigo/teal) —
// all readable as a tinted background with the same hue as text in both colour schemes.
const AVATAR_HUES = ['#2563EB', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#6366F1', '#14B8A6'];

export function avatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function avatarHue(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100000;
  }
  return AVATAR_HUES[hash % AVATAR_HUES.length];
}
