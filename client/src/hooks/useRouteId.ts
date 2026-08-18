import { useParams } from 'react-router-dom';

/**
 * Reads a record id out of the URL. Route segments are always strings, but every id in the API is
 * an auto-increment integer, so the segment is converted once here rather than at each call site.
 *
 * A missing or non-numeric segment yields NaN, which is falsy — so the existing `if (!id)` and
 * `enabled: Boolean(id)` guards keep working and a hand-typed URL renders "not found" instead of
 * firing a request that could never match a row.
 */
export function useRouteId(param: string = 'id'): number {
  const params = useParams();
  return Number(params[param]);
}
