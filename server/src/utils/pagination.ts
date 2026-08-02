const ALLOWED_LIMITS = [10, 20, 50, 100] as const;
const DEFAULT_LIMIT = 20;

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export function normalizePage(page?: number): number {
  return page && page > 0 ? page : 1;
}

export function normalizeLimit(limit?: number): number {
  if (limit && (ALLOWED_LIMITS as readonly number[]).includes(limit)) return limit;
  return DEFAULT_LIMIT;
}

export function buildPaginationMeta(page: number, limit: number, totalRecords: number): PaginationMeta {
  return {
    page,
    limit,
    totalRecords,
    totalPages: totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit),
  };
}
