import { z } from 'zod';
import { AppError } from './AppError';

const DEFAULT_MESSAGE = 'A valid identifier is required.';

// Route params always arrive as strings, but primary keys are auto-increment integers. Anything
// that is not a positive whole number can never match a row, so it is rejected here as a 400
// instead of reaching Prisma — which throws on NaN and would surface as a 500.
export function parseId(value: string, field = 'id'): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'Invalid identifier.', [
      { field, message: 'Must be a positive whole number.' },
    ]);
  }
  return id;
}

// Body and query identifiers. A JSON body carries an id as a number while a query string carries
// the same id as text, so the value is coerced before the integer check rather than being typed
// as one or the other.
export function idSchema(message: string = DEFAULT_MESSAGE): z.ZodNumber {
  return z.coerce.number({ invalid_type_error: message }).int(message).positive(message);
}
