import { ZodTypeAny, z } from 'zod';
import { AppError } from './AppError';

export function parseQuery<T extends ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
  const result = schema.safeParse(query);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw new AppError(400, 'Invalid query parameters.', errors);
  }
  return result.data;
}
