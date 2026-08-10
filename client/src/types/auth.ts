import type { EffectivePermission } from './permission';

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
    /** Relative upload path — resolve through getPublicAssetUrl before using as an <img> src. */
    logo: string | null;
  };
  permissions: EffectivePermission[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthenticatedProfile;
}
