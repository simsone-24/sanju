import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

// `sub` carries the user's primary key, which is an auto-increment integer. The payload is signed
// and verified in-house rather than through jsonwebtoken's `subject` option, so it stays a number
// end to end instead of being stringified and parsed back on every request.
export interface AccessTokenPayload {
  sub: number;
  companyId: number;
  userGroupId: number;
  userGroupName: string;
}

export interface RefreshTokenPayload {
  sub: number;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtRefreshSecret, options);
}

// jwt.verify is typed as returning JwtPayload, whose `sub` is a string; ours is the numeric user
// id, so the payload is widened through unknown before being narrowed to our own shape.
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtSecret) as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as unknown as RefreshTokenPayload;
}
