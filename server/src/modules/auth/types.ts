import { EffectivePermission } from '../permissions/types';

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  companyId: string;
  userGroupId: string;
  userGroupName: string;
  fullName: string;
  username: string;
  /** Group permissions merged with the user's own overrides — see permissions/service.ts. */
  permissions: EffectivePermission[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedProfile {
  id: string;
  fullName: string;
  username: string;
  email: string | null;
  mobile: string;
  city: string | null;
  profilePhoto: string | null;
  userGroup: {
    id: string;
    groupName: string;
  };
  company: {
    id: string;
    companyName: string;
  };
  // Read-only for the frontend's own conditional rendering (hide buttons a group can't use).
  // The backend remains the sole enforcer via the authorize() middleware regardless of what
  // this array says — never trust frontend permissions, per CLAUDE.md.
  permissions: EffectivePermission[];
}
