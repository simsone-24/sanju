import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthenticatedProfile, AuthTokens } from '../types/auth';

interface AuthState {
  user: AuthenticatedProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (tokens: AuthTokens, user: AuthenticatedProfile) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearSession: () => void;
}

// The persisted profile embeds the permission payload the server issued at login, so a session
// stored before that payload's shape changed (roles with per-module booleans -> user groups with
// { module, actions[] }) is unreadable to the current code. Bump this whenever AuthenticatedProfile
// changes shape; migrate() then drops the stale session and the user signs in again.
const AUTH_STORE_VERSION = 1;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (tokens, user) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user }),
      setTokens: (tokens) => set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'sanju-auth',
      version: AUTH_STORE_VERSION,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // An older session carries a profile the current app cannot read, and nothing in it can be
      // upgraded locally — the permissions have to come from the server. Clearing it sends the
      // user to the login screen rather than into a half-readable profile.
      migrate: () => ({ user: null, accessToken: null, refreshToken: null }),
    },
  ),
);
