import { EnquiryStatus, OrderStatus, Prisma, QuotationStatus, SequenceType } from '@prisma/client';
import * as enquiriesRepository from '../enquiries/repository';
import * as paymentTrackerRepository from '../payment-tracker/repository';
import * as quotationsRepository from '../quotations/repository';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import * as ordersRepository from './repository';
import { ChangeOrderStatusInput, ConvertToOrderInput, ListOrdersParams, UpdateOrderInput } from './types';

// An order's status now tracks the EVENT/work lifecycle only:
//
//   CONFIRMED → PLANNING → READY → IN_PROGRESS → COMPLETED → CLOSED   (+ CANCELLED side-branch)
//
// The three payment-shaped values (ADVANCE_PENDING, ADVANCE_RECEIVED, BALANCE_PENDING) are no
// longer part of the forward chain: how much has been paid is DERIVED from the order's amounts
// and shown as a separate Payment Status (docs/10_IMPLEMENTATION_DECISIONS.md §6 — "payment
// status is derived, not stored"), so encoding it in the work status duplicated that fact and
// forced coordinators through payment steps to advance the event.
//
// They remain reachable-FROM (not reachable-TO) so orders already sitting in one of them — this
// enum predates the split — can still move forward instead of being stranded.
const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CONFIRMED: [OrderStatus.PLANNING, OrderStatus.CANCELLED],
  PLANNING: [OrderStatus.READY, OrderStatus.CANCELLED],
  READY: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  IN_PROGRESS: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  COMPLETED: [OrderStatus.CLOSED, OrderStatus.CANCELLED],
  CLOSED: [],
  CANCELLED: [],
  // Legacy bridges — see above.
  ADVANCE_PENDING: [OrderStatus.PLANNING, OrderStatus.CANCELLED],
  ADVANCE_RECEIVED: [OrderStatus.PLANNING, OrderStatus.CANCELLED],
  BALANCE_PENDING: [OrderStatus.CLOSED, OrderStatus.CANCELLED],
};

// Postponing an event that's already happened (or an order that's already dead) doesn't make sense.
const EVENT_DATE_LOCKED_STATUSES: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.BALANCE_PENDING,
  OrderStatus.CLOSED,
  OrderStatus.CANCELLED,
];

export async function list(params: ListOrdersParams) {
  const { records, totalRecords } = await ordersRepository.listOrders(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export async function getStats(companyId: string) {
  return ordersRepository.getOrderStats(companyId);
}

export async function getById(companyId: string, id: string) {
  const order = await ordersRepository.findOrderById(companyId, id);
  if (!order) throw new AppError(404, 'Order not found.');
  return order;
}

// Confirmed enquiries not yet converted — feeds the Orders module's "Create Order" picker so
// conversion doesn't have to start from the Quotations screen.
export async function listEligibleEnquiries(companyId: string) {
  const enquiries = await ordersRepository.listEligibleEnquiries(companyId);
  return enquiries
    .filter((enquiry) => enquiry.quotations.length > 0)
    .map(({ quotations, ...enquiry }) => ({
      ...enquiry,
      quotation: quotations[0],
    }));
}

export async function getTimeline(companyId: string, id: string) {
  const order = await ordersRepository.findOrderById(companyId, id);
  if (!order) throw new AppError(404, 'Order not found.');
  return ordersRepository.getOrderActivityLog(id);
}

// Shared by convert() (explicit quotation picked by a user) and autoConvertFromEnquiry() (picked
// automatically). Wrapped in a transaction: creating the order and seeding its task checklist
// from templates must succeed together — otherwise the order would exist with no tasks.
async function buildOrderFromQuotation(
  companyId: string,
  actorId: string,
  enquiry: { id: string; enquiryNumber: string; eventDate: Date | null; venue: string | null; notes: string | null; customer: { id: string } | null },
  quotation: { id: string; quotationNumber: string; version: number; totalAmount: Prisma.Decimal },
) {
  // ORDER_CONFIRMED materialises the customer (enquiries/service.ts), so a linked customer must exist.
  if (!enquiry.customer) {
    throw new AppError(400, 'This enquiry has no linked customer. Confirm the order on the enquiry first.');
  }

  const existingOrder = await ordersRepository.findOrderByEnquiryId(companyId, enquiry.id);
  if (existingOrder) {
    throw new AppError(409, `This enquiry has already been converted to order "${existingOrder.orderNumber}".`);
  }

  const eventDate = enquiry.eventDate;
  if (!eventDate) {
    throw new AppError(400, 'The enquiry must have an event date set before it can be converted to an order.', [
      { field: 'eventDate', message: 'Event date is required.' },
    ]);
  }

  const orderNumber = await generateDocumentNumber(companyId, SequenceType.ORDER);

  const order = await prisma.$transaction(async (tx) => {
    const created = await ordersRepository.createOrder(
      {
        companyId,
        orderNumber,
        enquiryId: enquiry.id,
        quotationId: quotation.id,
        customerId: enquiry.customer!.id,
        eventDate,
        venue: enquiry.venue,
        notes: enquiry.notes,
        totalAmount: quotation.totalAmount,
        paidAmount: 0,
        pendingAmount: quotation.totalAmount,
        status: OrderStatus.CONFIRMED,
      },
      tx,
    );

    await ordersRepository.seedOrderTasksFromTemplates(companyId, created.id, tx);
    // "payment/payment.md" §Business Rules — "Every confirmed order automatically creates a
    // Payment Tracker record." Created here, in the same transaction as the order, so the tracker
    // can never be missing for an order that exists.
    await paymentTrackerRepository.ensureTracker(created.id, tx);
    // The enquiry is already ORDER_CONFIRMED (terminal); creating the order doesn't change its
    // status. The findOrderByEnquiryId guard above prevents a second order for the same enquiry.

    // Re-fetch: `created`'s select snapshot predates the task-seeding insert above, so its
    // `tasks` array would otherwise come back empty despite rows now existing.
    const withTasks = await ordersRepository.findOrderById(companyId, created.id, tx);
    return withTasks ?? created;
  });

  await logActivity({
    companyId,
    module: 'ORDERS',
    referenceId: order.id,
    action: 'ORDER_CONVERSION',
    description: `Order "${order.orderNumber}" created from enquiry "${enquiry.enquiryNumber}" and quotation "${quotation.quotationNumber}" (v${quotation.version}).`,
    performedById: actorId,
  });

  return order;
}

export async function convert(companyId: string, actorId: string, input: ConvertToOrderInput) {
  const enquiry = await enquiriesRepository.findEnquiryById(companyId, input.enquiryId);
  if (!enquiry) {
    throw new AppError(400, 'Selected enquiry does not exist.', [
      { field: 'enquiryId', message: 'Selected enquiry does not exist.' },
    ]);
  }

  if (enquiry.status !== EnquiryStatus.ORDER_CONFIRMED) {
    throw new AppError(
      400,
      `Cannot create an order for an enquiry with status ${enquiry.status}. The enquiry must be Order Confirmed first.`,
    );
  }

  const quotation = await quotationsRepository.findQuotationById(companyId, input.quotationId);
  if (!quotation) {
    throw new AppError(400, 'Selected quotation does not exist.', [
      { field: 'quotationId', message: 'Selected quotation does not exist.' },
    ]);
  }
  // Only enquiry-sourced quotations feed the order workflow; customer/order/manual quotations have
  // no enquiry link and can never be converted.
  if (!quotation.enquiry || quotation.enquiry.id !== input.enquiryId) {
    throw new AppError(400, 'Selected quotation does not belong to the selected enquiry.', [
      { field: 'quotationId', message: 'Selected quotation does not belong to the selected enquiry.' },
    ]);
  }
  if (quotation.status === QuotationStatus.REJECTED) {
    throw new AppError(400, 'Cannot create an order from a rejected quotation. Select a valid quotation.');
  }

  return buildOrderFromQuotation(companyId, actorId, enquiry, quotation);
}

// Best-effort automatic conversion, triggered the moment an enquiry reaches ORDER_CONFIRMED (see
// enquiries/service.ts changeStatus) so a confirmed enquiry doesn't need a separate manual "Create
// Order" step. Prefers the enquiry's approved quotation; falls back to its latest non-rejected
// revision so a confirmation made before formal approval still produces an order. Returns null
// (never throws) when there's nothing usable to convert yet — the caller's status change must
// succeed regardless, and the order can still be created manually once a quotation/event date exists.
export async function autoConvertFromEnquiry(companyId: string, actorId: string, enquiryId: string) {
  const enquiry = await enquiriesRepository.findEnquiryById(companyId, enquiryId);
  if (!enquiry || enquiry.status !== EnquiryStatus.ORDER_CONFIRMED) return null;

  const existingOrder = await ordersRepository.findOrderByEnquiryId(companyId, enquiryId);
  if (existingOrder) return existingOrder;

  const approved = await quotationsRepository.findApprovedQuotationForEnquiry(companyId, enquiryId);
  const candidate = approved ?? (await quotationsRepository.findLatestQuotationForEnquiry(companyId, enquiryId));
  if (!candidate || candidate.status === QuotationStatus.REJECTED) return null;

  const quotation = await quotationsRepository.findQuotationById(companyId, candidate.id);
  if (!quotation) return null;

  try {
    return await buildOrderFromQuotation(companyId, actorId, enquiry, quotation);
  } catch {
    // e.g. missing event date — leave it for manual conversion from the Orders module.
    return null;
  }
}

export async function update(companyId: string, actorId: string, id: string, input: UpdateOrderInput) {
  const existing = await ordersRepository.findOrderById(companyId, id);
  if (!existing) throw new AppError(404, 'Order not found.');

  if (input.coordinatorId) {
    const coordinator = await enquiriesRepository.findUserForCompany(companyId, input.coordinatorId);
    if (!coordinator) {
      throw new AppError(400, 'Selected coordinator does not exist.', [
        { field: 'coordinatorId', message: 'Selected coordinator does not exist.' },
      ]);
    }
  }

  if (input.eventDate && EVENT_DATE_LOCKED_STATUSES.includes(existing.status)) {
    throw new AppError(400, `Cannot change the event date for an order with status ${existing.status}.`);
  }

  const previousEventDate = existing.eventDate;

  const order = await ordersRepository.updateOrder(id, {
    eventDate: input.eventDate,
    venue: input.venue,
    notes: input.notes,
    remarks: input.remarks,
    coordinatorId: input.coordinatorId,
  });

  // 02_BUSINESS_WORKFLOW.md §14 "Event Postponed" — previous date retained in the activity log.
  let description = `Order "${existing.orderNumber}" updated.`;
  if (input.eventDate && previousEventDate.getTime() !== input.eventDate.getTime()) {
    description += ` Event date changed from ${previousEventDate.toISOString().slice(0, 10)} to ${input.eventDate
      .toISOString()
      .slice(0, 10)}.`;
  }

  await logActivity({
    companyId,
    module: 'ORDERS',
    referenceId: id,
    action: 'UPDATE',
    description,
    performedById: actorId,
  });

  return order;
}

export async function changeStatus(companyId: string, actorId: string, id: string, input: ChangeOrderStatusInput) {
  const existing = await ordersRepository.findOrderById(companyId, id);
  if (!existing) throw new AppError(404, 'Order not found.');

  const allowedNext = ORDER_STATUS_TRANSITIONS[existing.status];
  if (!allowedNext.includes(input.status)) {
    throw new AppError(400, `Cannot change status from ${existing.status} to ${input.status}.`, [
      {
        field: 'status',
        message: `Allowed next status(es): ${allowedNext.length ? allowedNext.join(', ') : 'none (terminal status)'}.`,
      },
    ]);
  }

  // ADVANCE_RECEIVED / BALANCE_PENDING are no longer transition targets (see
  // ORDER_STATUS_TRANSITIONS), so their old preconditions are gone with them. Closing still
  // requires a settled balance — that's a financial safeguard, not a workflow step, and an order
  // shouldn't be closed while money is outstanding (04_DATABASE_DESIGN.md §9).
  if (input.status === OrderStatus.CLOSED && Number(existing.pendingAmount) > 0) {
    throw new AppError(400, 'Cannot close an order with an outstanding pending amount.', [
      { field: 'status', message: `Pending amount: ${existing.pendingAmount}.` },
    ]);
  }

  const order = await ordersRepository.updateOrder(id, {
    status: input.status,
    ...(input.status === OrderStatus.CANCELLED ? { cancellationReason: input.cancellationReason } : {}),
  });

  let description = `Order "${existing.orderNumber}" status changed from ${existing.status} to ${input.status}.`;
  if (input.status === OrderStatus.CANCELLED && input.cancellationReason) {
    description += ` Reason: ${input.cancellationReason}`;
  }
  if (input.remarks) {
    description += ` Remarks: ${input.remarks}`;
  }

  await logActivity({
    companyId,
    module: 'ORDERS',
    referenceId: id,
    action: 'STATUS_CHANGE',
    description,
    performedById: actorId,
  });

  return order;
}
