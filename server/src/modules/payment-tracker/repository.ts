import { OrderStatus, Prisma, PaymentType } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import {
  ListPaymentTrackerParams,
  PAYMENT_TRACKER_STATUS_GROUPS,
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

// Cancelled orders carry no payment obligation, so they stay out of the module entirely —
// "payment/payment.md" scopes it to confirmed orders. Their tracker rows still exist (see the
// backfill migration) in case an order is ever reinstated.
function baseWhere(companyId: string): Prisma.OrderWhereInput {
  return { companyId, deletedAt: null, status: { not: OrderStatus.CANCELLED } };
}

function buildListWhere(params: ListPaymentTrackerParams): Prisma.OrderWhereInput {
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

// The seven dashboard cards. Counts come from the stored tracker status so a manual override is
// reflected in the cards exactly as it is in the list, and the money totals are SQL sums rather
// than a page of rows added up in JS.
export async function getPaymentTrackerStats(companyId: string) {
  const where = baseWhere(companyId);
  const countIn = (group: keyof typeof PAYMENT_TRACKER_STATUS_GROUPS) =>
    prisma.order.count({
      where: { ...where, paymentTracker: { paymentStatus: { in: [...PAYMENT_TRACKER_STATUS_GROUPS[group]] } } },
    });

  const [totalOrders, pendingPayments, partialPayments, fullyPaidOrders, totals] = await Promise.all([
    prisma.order.count({ where }),
    countIn('PENDING'),
    countIn('PARTIAL'),
    countIn('PAID'),
    prisma.order.aggregate({ where, _sum: { totalAmount: true, paidAmount: true, pendingAmount: true } }),
  ]);

  return {
    totalOrders,
    pendingPayments,
    partialPayments,
    fullyPaidOrders,
    totalBudget: Number(totals._sum.totalAmount ?? 0),
    totalCollected: Number(totals._sum.paidAmount ?? 0),
    outstandingBalance: Number(totals._sum.pendingAmount ?? 0),
  };
}

export function findTrackerOrderById(companyId: string, orderId: string, client: PrismaClientOrTx = prisma) {
  return client.order.findFirst({ where: { id: orderId, ...baseWhere(companyId) }, select: trackerDetailSelect });
}

// Orders created before this module existed are covered by the backfill migration; this guards the
// remaining gap (an order whose tracker row was never written) so an edit can never 404 on it.
export async function ensureTracker(orderId: string, client: PrismaClientOrTx = prisma) {
  const existing = await client.paymentTracker.findUnique({ where: { orderId }, select: { id: true } });
  if (existing) return existing;
  return client.paymentTracker.create({ data: { orderId }, select: { id: true } });
}

export function updateTracker(
  orderId: string,
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
  orderId: string,
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

export function getTrackerActivityLog(orderId: string, client: PrismaClientOrTx = prisma) {
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
