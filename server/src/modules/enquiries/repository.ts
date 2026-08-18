import { AppointmentStatus, EnquiryStatus, Prisma } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { EnquiryStatsParams, ListEnquiriesParams } from './types';

const enquiryListSelect = {
  id: true,
  enquiryNumber: true,
  eventName: true,
  eventDate: true,
  appointmentDate: true,
  // Listed alongside the date on the Enquiry index's Appointment column
  // ("md files/Enquiry/indexUI.md" §Appointment — "27 Jul 2026 / 10:30 AM").
  appointmentTime: true,
  appointmentStatus: true,
  status: true,
  createdAt: true,
  // Nullable until the enquiry reaches ORDER_CONFIRMED — prospect_* fields carry the customer's
  // details in the meantime (see mapEnquiry in service.ts, which normalises the two into one shape).
  customer: { select: { id: true, customerName: true, mobile: true } },
  prospectName: true,
  prospectMobile: true,
  eventType: { select: { id: true, eventName: true, colorCode: true } },
  assignedUser: { select: { id: true, fullName: true } },
} satisfies Prisma.EnquirySelect;

const enquiryDetailSelect = {
  ...enquiryListSelect,
  prospectWhatsapp: true,
  prospectEmail: true,
  prospectAddress: true,
  prospectCity: true,
  eventTime: true,
  mahal: true,
  venue: true,
  estimatedBudget: true,
  finalBudgetAmount: true,
  advanceAmount: true,
  notes: true,
  meetingLocation: true,
  appointmentNotes: true,
  quotationAmount: true,
  quotationVersion: true,
  followUpDate: true,
  updatedAt: true,
  followUps: {
    orderBy: { followUpDate: 'desc' },
    select: {
      id: true,
      followUpDate: true,
      notes: true,
      outcome: true,
      createdAt: true,
      createdBy: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.EnquirySelect;

// Shared by listEnquiries and getEnquiryStats — every filter that isn't pagination or the
// dashboard cards' own statusGroup, so the two stay in lockstep by construction rather than by
// two hand-kept copies drifting apart.
function buildEnquiryConditions(params: EnquiryStatsParams): Prisma.EnquiryWhereInput[] {
  const conditions: Prisma.EnquiryWhereInput[] = [];

  if (params.status) conditions.push({ status: params.status });
  if (params.appointmentStatus) conditions.push({ appointmentStatus: params.appointmentStatus });
  if (params.eventTypeId) conditions.push({ eventTypeId: params.eventTypeId });
  if (params.assignedUserId) conditions.push({ assignedUserId: params.assignedUserId });
  if (params.customerId) conditions.push({ customerId: params.customerId });
  if (params.eventDateFrom || params.eventDateTo) {
    conditions.push({
      eventDate: {
        ...(params.eventDateFrom ? { gte: params.eventDateFrom } : {}),
        ...(params.eventDateTo ? { lte: params.eventDateTo } : {}),
      },
    });
  }
  if (params.appointmentDateFrom || params.appointmentDateTo) {
    conditions.push({
      appointmentDate: {
        ...(params.appointmentDateFrom ? { gte: params.appointmentDateFrom } : {}),
        ...(params.appointmentDateTo ? { lte: params.appointmentDateTo } : {}),
      },
    });
  }
  if (params.search) {
    conditions.push({
      OR: [
        { enquiryNumber: { contains: params.search } },
        { customer: { customerName: { contains: params.search } } },
        { customer: { mobile: { contains: params.search } } },
        // Unconfirmed enquiries have no linked customer yet — match the prospect fields too.
        { prospectName: { contains: params.search } },
        { prospectMobile: { contains: params.search } },
      ],
    });
  }

  return conditions;
}

export async function listEnquiries(params: ListEnquiriesParams) {
  // Built as an AND-list rather than spread into one object: the dropdown's `status`/
  // `appointmentStatus` equality and the dashboard cards' `statusGroup` range can both target the
  // same field (e.g. Enquiry Status dropdown + the Appointment Pending card), and spreading two
  // objects with the same key into one literal makes the later one silently win instead of
  // combining — which was dropping whichever filter got merged in first.
  const conditions = buildEnquiryConditions(params);
  for (const group of params.statusGroup ?? []) {
    if (group === 'ACTIVE') conditions.push({ status: { not: EnquiryStatus.ORDER_LOST } });
    if (group === 'CONFIRMED') conditions.push({ status: EnquiryStatus.ORDER_CONFIRMED });
    if (group === 'PENDING') {
      conditions.push({ status: { notIn: [EnquiryStatus.ORDER_CONFIRMED, EnquiryStatus.ORDER_LOST] } });
    }
    if (group === 'APPOINTMENT_PENDING') {
      conditions.push({ status: { not: EnquiryStatus.ORDER_LOST } });
      conditions.push({ appointmentStatus: { in: [AppointmentStatus.PENDING, AppointmentStatus.IN_PROGRESS] } });
    }
  }

  const where: Prisma.EnquiryWhereInput = {
    companyId: params.companyId,
    deletedAt: null,
    ...(conditions.length ? { AND: conditions } : {}),
  };

  const [records, totalRecords] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      select: enquiryListSelect,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.enquiry.count({ where }),
  ]);

  return { records, totalRecords };
}

// "md files/Enquiry/dashcount.md" §1-4. Each count narrows along with every other active list
// filter (search, status, appointment status, event type, assigned user, date ranges) — only the
// status/appointment-status condition that defines the card itself is fixed.
export async function getEnquiryStats(params: EnquiryStatsParams) {
  const conditions = buildEnquiryConditions(params);
  const withGroup = (...extra: Prisma.EnquiryWhereInput[]): Prisma.EnquiryWhereInput => ({
    companyId: params.companyId,
    deletedAt: null,
    AND: [...conditions, ...extra],
  });

  const [totalEnquiries, confirmedEnquiries, pendingEnquiries, appointmentPending] = await Promise.all([
    prisma.enquiry.count({ where: withGroup({ status: { not: EnquiryStatus.ORDER_LOST } }) }),
    prisma.enquiry.count({ where: withGroup({ status: EnquiryStatus.ORDER_CONFIRMED }) }),
    prisma.enquiry.count({
      where: withGroup({ status: { notIn: [EnquiryStatus.ORDER_CONFIRMED, EnquiryStatus.ORDER_LOST] } }),
    }),
    prisma.enquiry.count({
      where: withGroup(
        { status: { not: EnquiryStatus.ORDER_LOST } },
        { appointmentStatus: { in: [AppointmentStatus.PENDING, AppointmentStatus.IN_PROGRESS] } },
      ),
    }),
  ]);

  return { totalEnquiries, confirmedEnquiries, pendingEnquiries, appointmentPending };
}

export function findEnquiryById(companyId: number, id: number) {
  return prisma.enquiry.findFirst({ where: { id, companyId, deletedAt: null }, select: enquiryDetailSelect });
}

export function findEventTypeForCompany(companyId: number, eventTypeId: number, client: PrismaClientOrTx = prisma) {
  return client.eventType.findFirst({ where: { id: eventTypeId, companyId, deletedAt: null } });
}

export function findUserForCompany(companyId: number, userId: number, client: PrismaClientOrTx = prisma) {
  return client.user.findFirst({ where: { id: userId, companyId, deletedAt: null, isActive: true } });
}

export function createEnquiry(data: Prisma.EnquiryUncheckedCreateInput, client: PrismaClientOrTx = prisma) {
  return client.enquiry.create({ data, select: enquiryDetailSelect });
}

export function updateEnquiry(
  id: number,
  data: Prisma.EnquiryUncheckedUpdateInput,
  client: PrismaClientOrTx = prisma,
) {
  return client.enquiry.update({ where: { id }, data, select: enquiryDetailSelect });
}

export function updateEnquiryStatus(id: number, status: EnquiryStatus, client: PrismaClientOrTx = prisma) {
  return client.enquiry.update({ where: { id }, data: { status }, select: enquiryDetailSelect });
}

/**
 * Every activity_logs row belonging to an enquiry's story — "md files/Enquiry/enq.md" §8.
 *
 * The log is keyed by (module, referenceId), and an enquiry's history is spread across three of
 * them: the enquiry itself, each of its quotations, and the order it became (plus that order's
 * payments, which is where the timeline's "Payment Tracking" tail comes from). The ids are gathered
 * first so the whole timeline is one indexed query over the pairs rather than a read per record.
 */
export async function getEnquiryTimeline(companyId: number, enquiryId: number) {
  const [quotations, order] = await Promise.all([
    prisma.quotation.findMany({
      where: { enquiryId, companyId, deletedAt: null },
      select: { id: true },
    }),
    prisma.order.findFirst({
      where: { enquiryId, companyId, deletedAt: null },
      select: { id: true },
    }),
  ]);

  const quotationIds = quotations.map((quotation) => quotation.id);
  const orderIds = order ? [order.id] : [];

  return prisma.activityLog.findMany({
    where: {
      OR: [
        { module: 'ENQUIRIES', referenceId: enquiryId },
        ...(quotationIds.length ? [{ module: 'QUOTATIONS', referenceId: { in: quotationIds } }] : []),
        ...(orderIds.length
          ? [
              { module: 'ORDERS', referenceId: { in: orderIds } },
              { module: 'PAYMENT_TRACKER', referenceId: { in: orderIds } },
            ]
          : []),
      ],
    },
    // Newest first: the timeline is read from the top, and the most recent activity is what a user
    // opening the enquiry is looking for.
    orderBy: { performedAt: 'desc' },
    select: {
      id: true,
      module: true,
      action: true,
      description: true,
      performedAt: true,
      performedBy: { select: { id: true, fullName: true } },
    },
  });
}

/**
 * Soft-deletes an enquiry together with everything that hangs off it: its quotations and the order
 * it became, plus that order's payments, invoice, payment tracker, task plan and documents.
 *
 * All of it in one transaction, so an enquiry can never end up deleted while live children still
 * point at it. Only models that actually carry a `deleted_at` column are stamped —
 * enquiry_followups, quotation_items and order_tasks have none, but each is read exclusively
 * through its (now deleted) parent, so they become unreachable rather than orphaned.
 */
export async function softDeleteEnquiryCascade(companyId: number, enquiryId: number) {
  return prisma.$transaction(async (tx) => {
    const deletedAt = new Date();

    const orders = await tx.order.findMany({
      where: { enquiryId, companyId, deletedAt: null },
      select: { id: true },
    });
    const orderIds = orders.map((order) => order.id);

    // Both the quotations raised against the enquiry and any raised later from its order.
    const quotations = await tx.quotation.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [{ enquiryId }, ...(orderIds.length ? [{ orderId: { in: orderIds } }] : [])],
      },
      select: { id: true },
    });
    const quotationIds = quotations.map((quotation) => quotation.id);

    const taskGroups = orderIds.length
      ? await tx.taskGroup.findMany({
          where: { orderId: { in: orderIds }, deletedAt: null },
          select: { id: true },
        })
      : [];
    const taskGroupIds = taskGroups.map((taskGroup) => taskGroup.id);

    if (quotationIds.length) {
      await tx.quotationImage.updateMany({
        where: { quotationId: { in: quotationIds }, deletedAt: null },
        data: { deletedAt },
      });
      await tx.quotation.updateMany({ where: { id: { in: quotationIds } }, data: { deletedAt } });
    }

    if (taskGroupIds.length) {
      await tx.taskItem.updateMany({
        where: { taskGroupId: { in: taskGroupIds }, deletedAt: null },
        data: { deletedAt },
      });
      await tx.taskGroup.updateMany({ where: { id: { in: taskGroupIds } }, data: { deletedAt } });
    }

    if (orderIds.length) {
      await tx.payment.updateMany({ where: { orderId: { in: orderIds }, deletedAt: null }, data: { deletedAt } });
      await tx.invoice.updateMany({ where: { orderId: { in: orderIds }, deletedAt: null }, data: { deletedAt } });
      await tx.paymentTracker.updateMany({
        where: { orderId: { in: orderIds }, deletedAt: null },
        data: { deletedAt },
      });
      await tx.orderDocument.updateMany({
        where: { orderId: { in: orderIds }, deletedAt: null },
        data: { deletedAt },
      });
      await tx.order.updateMany({ where: { id: { in: orderIds } }, data: { deletedAt } });
    }

    await tx.enquiry.update({ where: { id: enquiryId }, data: { deletedAt } });

    return { orderCount: orderIds.length, quotationCount: quotationIds.length };
  });
}

export function createFollowUp(data: Prisma.EnquiryFollowUpUncheckedCreateInput) {
  return prisma.enquiryFollowUp.create({
    data,
    select: {
      id: true,
      followUpDate: true,
      notes: true,
      outcome: true,
      createdAt: true,
      createdBy: { select: { id: true, fullName: true } },
    },
  });
}
