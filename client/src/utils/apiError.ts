import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api';

/**
 * The server's own message for a failed request — every API error comes back in the standard
 * envelope ({ success: false, message, errors }), so its `message` is already user-facing.
 * `fallback` covers failures that carry no response at all: a dropped connection, a timeout, or
 * an error thrown before the request left the client.
 */
export function describeApiError(caught: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(caught) && caught.response) return caught.response.data.message;
  return fallback;
}
