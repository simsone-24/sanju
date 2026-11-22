import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as authService from '../services/authService';
import { useAuthStore } from '../store/authStore';

/** The query key for the signed-in user's own profile — invalidate it after changing their access. */
export const PROFILE_QUERY_KEY = ['auth', 'me'] as const;

/**
 * Keeps the signed-in user's stored profile — and so their permissions — in step with the server.
 *
 * The profile is saved when someone signs in and was never read again, so a permission granted
 * afterwards (an admin ticking a box for their own group) stayed invisible until they signed out and
 * back in: the buttons it unlocks simply did not appear. Re-reading it on load, when the tab regains
 * focus, and after a group or user is saved means access changes show up on their own.
 *
 * The check is best-effort: if it fails (offline, an expired token that the next request will
 * refresh) the stored profile is left alone rather than treated as a sign-out.
 */
export function useProfileSync(): void {
  const signedIn = useAuthStore((state) => state.user !== null);
  const setUser = useAuthStore((state) => state.setUser);

  const { data } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => authService.fetchCurrentUser(),
    enabled: signedIn,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  useEffect(() => {
    if (!data) return;
    // Compared against the live store rather than a captured value, and only written when something
    // actually changed, so a refresh that finds nothing new causes no re-render.
    const current = useAuthStore.getState().user;
    if (JSON.stringify(current) !== JSON.stringify(data)) setUser(data);
  }, [data, setUser]);
}
