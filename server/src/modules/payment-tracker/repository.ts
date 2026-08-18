import { OrderStatus, PaymentTrackerStatus, Prisma, PaymentType } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import {
  ListPaymentTrackerParams,
  PAYMENT_TRACKER_STATUS_GROUPS,
  PaymentTrackerStatsParams,
  derivePaymentTrackerStatus,
} from './types';

// The tracker reads Orders directly — budget/collected/balance already live there, and
// "payment/payment.md" §Business Rules forbids duplicating order information into this module.
// payment_trackers contributes only the two fields the tracker itself owns.
const trackerListSelect = {
  id: true,
  orderNumber: true,
  eventDate: true,
  venue: true,
  status: true,
  totalAmount: true,
  paidAmount: true,
  pendingAmount: true,
  customer: { select: { id: true, customerName: true, mobile: true } },
  // Event name/type live on the linked enquiry — Order has no event name column of its own.
  enquiry: { select: { eventName: true, eventType: { select: { eventName: true } } } },
  paymentTracker: { select: { id: true, paymentStatus: true, statusManual: true, remarks: true } },
} satisfies Prisma.OrderSelect;

const trackerDetailSelect = {
  ...trackerListSelect,
  createdAt: true,
  updatedAt: true,
  // Widens (never narrows) trackerListSelect's customer so the detail response stays assignable to
  // the list row. Mobile is required by §View Payment Details.
  customer: { select: { id: true, customerName: true, mobile: true, email: true } },
  coordinator: { select: { id: true, fullName: true } },
  // §Actions "Payment History" — the receipts behind the Collected figure, newest first.
  payments: {
    where: { deletedAt: null },
    orderBy: { paymentDate: 'desc' },
    select: {
      id: true,
      paymentDate: true,
      paymentType: true,
      amount: true,
      paymentMethod: true,
      receiptNumber: true,
      referenceNumber: true,
      remarks: true,
      receivedBy: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.OrderSelect;

export type PaymentTrackerListRow = Prisma.OrderGetPayload<{ select: typeof trackerListSelect }>;
export type PaymentTrackerDetail = Prisma.OrderGetPayload<{ select: typeof trackerDetailSelect }>;

// Rejected orders carry no payment obligation, so they stay out of the module entirely —
// "payment/payment.md" scopes it to confirmed orders. Their tracker rows still exist (see the
// backfill migration) in case an order is ever reinstated.
function baseWhere(companyId: number): Prisma.OrderWhereInput {
  return { companyId, deletedAt: null, status: { not: OrderStatus.REJECTED } };
}

// Shared by listPaymentTrackers and getPaymentTrackerStats — every filter the list accepts except
// pagination, so the two stay in lockstep by construction.
function buildListWhere(params: PaymentTrackerStatsParams): Prisma.OrderWhereInput {
  return {
    ...baseWhere(params.companyId),
    ...(params.orderStatus ? { status: params.orderStatus } : {}),
    ...(params.customerId ? { customerId: params.customerId } : {}),
    ...(params.paymentStatus ? { paymentTracker: { paymentStatus: params.paymentStatus } } : {}),
    ...(params.statusGroup && !params.paymentStatus
      ? { paymentTracker: { paymentStatus: { in: [...PAYMENT_TRACKER_STATUS_GROUPS[params.statusGroup]] } } }
      : {}),
    ...(params.eventDateFrom || params.eventDateTo
      ? {
          eventDate: {
            ...(params.eventDateFrom ? { gte: params.eventDateFrom } : {}),
            ...(params.eventDateTo ? { lte: params.eventDateTo } : {}),
          },
        }
      : {}),
    ...(params.search
      ? {
          OR: [
            { orderNumber: { contains: params.search } },
            { customer: { customerName: { contains: params.search } } },
            { customer: { mobile: { contains: params.search } } },
          ],
        }
      : {}),
  };
}

export async function listPaymentTrackers(params: ListPaymentTrackerParams) {
  const where = buildListWhere(params);

  const [records, totalRecords] = await Promise.all([
    prisma.order.findMany({
      where,
      select: trackerListSelect,
      // Soonest event first, matching the Orders list: money is chased against the event calendar,
      // not against when the paperwork was raised.
      orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }],
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { records, totalRecords };
}

// The three dashboard cards (Total Expected, Collected, Pending) plus the status counts that back
// their subtext. Narrows along with every other active list filter (search, customer, payment
// status, order status, event-date range) — the money totals are SQL sums rather than a page of
// rows added up in JS, and the counts come from the stored tracker status so a manual override is
// reflected exactly as it is in the list.
export async function getPaymentTrackerStats(params: PaymentTrackerStatsParams) {
  const where = buildListWhere(params);
  // AND'd against `where` rather than spread into it — `where` may already carry its own
  // `paymentTracker` condition (the paymentStatus/statusGroup filters), and spreading a second
  // `paymentTracker` key into the same object literal would silently replace it instead of
  // narrowing further.
  const withStatus = (status: PaymentTrackerStatus): Prisma.OrderWhereInput => ({
    AND: [where, { paymentTracker: { paymentStatus: status } }],
  });

  const [totalOrders, advanceCount, partialCount, completedCount, totals] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.count({ where: withStatus(PaymentTrackerStatus.ADVANCE_PAID) }),
    prisma.order.count({ where: withStatus(PaymentTrackerStatus.PARTIAL_PAYMENT) }),
    prisma.order.count({ where: withStatus(PaymentTrackerStatus.FULLY_PAID) }),
    prisma.order.aggregate({ where, _sum: { totalAmount: true, paidAmount: true, pendingAmount: true } }),
  ]);

  return {
    totalOrders,
    totalExpectedAmount: Number(totals._sum.totalAmount ?? 0),
    advanceCount,
    partialCount,
    completedCount,
    totalCollected: Number(totals._sum.paidAmount ?? 0),
    pendingAmount: Number(totals._sum.pendingAmount ?? 0),
  };
}

export function findTrackerOrderById(companyId: number, orderId: number, client: PrismaClientOrTx = prisma) {
  return client.order.findFirst({ where: { id: orderId, ...baseWhere(companyId) }, select: trackerDetailSelect });
}

// Orders created before this module existed are covered by the backfill migration; this guards the
// remaining gap (an order whose tracker row was never written) so an edit can never 404 on it.
export async function ensureTracker(orderId: number, client: PrismaClientOrTx = prisma) {
  const existing = await client.paymentTracker.findUnique({ where: { orderId }, select: { id: true } });
  if (existing) return existing;
  return client.paymentTracker.create({ data: { orderId }, select: { id: true } });
}

export function updateTracker(
  orderId: number,
  data: Prisma.PaymentTrackerUncheckedUpdateInput,
  client: PrismaClientOrTx = prisma,
) {
  return client.paymentTracker.update({ where: { orderId }, data });
}

/**
 * Recomputes the automatic status after the order's money changes — a payment recorded, or the
 * budget edited. Leaves a manually pinned status untouched (see PaymentTracker.statusManual).
 * Called from payments/service.ts inside the same transaction that writes the payment, so the
 * status can never lag the amounts it is derived from.
 */
export async function syncTrackerStatus(
  orderId: number,
  budget: number,
  collected: number,
  client: PrismaClientOrTx = prisma,
) {
  const tracker = await client.paymentTracker.findUnique({
    where: { orderId },
    select: { id: true, statusManual: true },
  });

  const nonAdvanceCount = await client.payment.count({
    where: { orderId, deletedAt: null, paymentType: { not: PaymentType.ADVANCE } },
  });
  const paymentStatus = derivePaymentTrackerStatus(budget, collected, nonAdvanceCount);

  if (!tracker) {
    await client.paymentTracker.create({ data: { orderId, paymentStatus } });
    return paymentStatus;
  }

  if (tracker.statusManual) return null;

  await client.paymentTracker.update({ where: { orderId }, data: { paymentStatus } });
  return paymentStatus;
}

export function getTrackerActivityLog(orderId: number, client: PrismaClientOrTx = prisma) {
  return client.activityLog.findMany({
    where: { module: 'PAYMENT_TRACKER', referenceId: orderId },
    orderBy: { performedAt: 'desc' },
    select: {
      id: true,
      action: true,
      description: true,
      performedAt: true,
      performedBy: { select: { id: true, fullName: true } },
    },
  });
}
