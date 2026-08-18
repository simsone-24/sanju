import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '../types/api';

/**
 * The server's own message for a failed request — every API error comes back in the standard
 * envelope ({ success: false, message, errors }), so its `message` is already user-facing.
 * `fallback` covers failures that carry no response at all: a dropped connection, a timeout, or
 * an error thrown before the request left the client.
 *
 * A validation failure's message is deliberately generic ("Validation failed."); the field list
 * alongside it is the part that says which input to correct, so it is appended rather than
 * dropped. Field-less entries — a schema rule that spans the whole body — contribute their
 * message on its own.
 */
export function describeApiError(caught: unknown, fallback: string): string {
  if (!isAxiosError<ApiErrorResponse>(caught) || !caught.response) return fallback;

  const data = caught.response.data;
  // A gateway or proxy failure answers with its own body, not the envelope.
  if (!data?.message) return fallback;

  const details = (data.errors ?? []).map((error) =>
    error.field ? `${error.field}: ${error.message}` : error.message,
  );

  return details.length ? `${data.message} ${details.join(' ')}` : data.message;
}
