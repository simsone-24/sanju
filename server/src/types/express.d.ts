import { AuthenticatedUser } from '../modules/auth/types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
