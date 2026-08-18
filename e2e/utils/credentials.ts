import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(__dirname, '../../server/.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. The e2e suite reads the seeded Super Admin credentials from server/.env.`,
    );
  }
  return value.trim();
}

export const ADMIN = {
  username: required('SEED_ADMIN_USERNAME').toLowerCase(),
  password: required('SEED_ADMIN_PASSWORD'),
};
