import type { OrderTimelineEntry } from '../../types/order';
import { ORDER_STAGES, type OrderStage } from './orderStatusTransitions';

export type OrderStageDates = Record<OrderStage, string | null>;

const STAGE_KEYS: string[] = ORDER_STAGES.map((stage) => stage.key);

// The activity log's `metadata` is an untyped JSON column, so the target status is read rather than
// cast: rows written before orders/service.ts started recording `{ from, to }` simply have none,
// and the tracker shows an em dash for those stages instead of guessing from the description text.
function statusChangeTarget(entry: OrderTimelineEntry): OrderStage | null {
  if (entry.action !== 'STATUS_CHANGE') return null;
  const target = entry.metadata?.to;
  return typeof target === 'string' && STAGE_KEYS.includes(target) ? (target as OrderStage) : null;
}

/**
 * When the order entered each lifecycle stage.
 *
 * Every order is created at Yet to Start (Prisma's default on Order.status), so that stage is dated
 * from the order itself; the rest come from the status change that moved it there. Entries arrive
 * newest first, so the first status change for each stage is its most recent — the answer to
 * "when was this closed?" is the last time it was closed, not the first.
 */
export function resolveStageDates(createdAt: string, entries: OrderTimelineEntry[]): OrderStageDates {
  const dates: OrderStageDates = { YET_TO_START: createdAt, IN_PROGRESS: null, ORDER_CLOSED: null };
  for (const entry of entries) {
    const target = statusChangeTarget(entry);
    if (target && dates[target] === null) dates[target] = entry.performedAt;
  }
  return dates;
}

/**
 * Who raised the order. Orders are never created by hand — they are converted from a confirmed
 * enquiry — so the ORDER_CONVERSION entry is the creation record. Falling back to the oldest entry
 * covers a trail whose first row was written under a different action.
 */
export function resolveCreatedBy(entries: OrderTimelineEntry[]): string | null {
  const conversion = entries.find((entry) => entry.action === 'ORDER_CONVERSION');
  return (conversion ?? entries[0])?.performedBy?.fullName ?? null;
}
