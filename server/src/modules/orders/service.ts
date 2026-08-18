import { EnquiryStatus, OrderStatus, PaymentMethod, PaymentType, Prisma, SequenceType } from '@prisma/client';
import * as enquiriesRepository from '../enquiries/repository';
import * as paymentsRepository from '../payments/repository';
import * as paymentsService from '../payments/service';
import * as paymentTrackerRepository from '../payment-tracker/repository';
import * as quotationsRepository from '../quotations/repository';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import * as ordersRepository from './repository';
import {
  ChangeOrderStatusInput,
  ConvertToOrderInput,
  ListOrdersParams,
  OrderStatsParams,
  UpdateOrderInput,
} from './types';

// An order's status tracks the EVENT/work lifecycle only, as 4 stages: Yet to Start, In Progress,
// Order Closed, Rejected. Any status may be changed to any other at any time (changeStatus below) —
// how much has been paid is DERIVED from the order's amounts and shown as a separate Payment Status
// (docs/10_IMPLEMENTATION_DECISIONS.md §6 — "payment status is derived, not stored"), tracked in the
// Payment Tracker module rather than gating this transition, and task planning is tracked on its own
// TaskGroup/TaskItem records — neither reads this field.

// Postponing an event that's already closed out (or an order that's already dead) doesn't make sense.
const EVENT_DATE_LOCKED_STATUSES: OrderStatus[] = [OrderStatus.ORDER_CLOSED, OrderStatus.REJECTED];

export async function list(params: ListOrdersParams) {
  const { records, totalRecords } = await ordersRepository.listOrders(params);
  return { records, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export async function getStats(params: OrderStatsParams) {
  return ordersRepository.getOrderStats(params);
}

export async function getById(companyId: number, id: number) {
  const order = await ordersRepository.findOrderById(companyId, id);
  if (!order) throw new AppError(404, 'Order not found.');
  return order;
}

// Confirmed enquiries not yet converted — feeds the Orders module's "Create Order" picker so
// conversion doesn't have to start from the Quotations screen.
export async function listEligibleEnquiries(companyId: number) {
  const enquiries = await ordersRepository.listEligibleEnquiries(companyId);
  return enquiries
    .filter((enquiry) => enquiry.quotations.length > 0)
    .map(({ quotations, ...enquiry }) => ({
      ...enquiry,
      quotation: quotations[0],
    }));
}

export async function getTimeline(companyId: number, id: number) {
  const order = await ordersRepository.findOrderById(companyId, id);
  if (!order) throw new AppError(404, 'Order not found.');
  return ordersRepository.getOrderActivityLog(id);
}

// The money an order opens with. Final Budget leads: it starts out as the approved quotation's
// total (quotations/service.ts approve()) but is editable on the enquiry afterwards, so when the
// two disagree the enquiry's figure is the later, deliberate decision. Then the quotation total,
// then what the customer was estimated, then zero — an order with no agreed price yet, correctable
// from the Order Details page.
function resolveOrderTotal(
  enquiry: { finalBudgetAmount: Prisma.Decimal | null; estimatedBudget: Prisma.Decimal | null },
  quotation: { totalAmount: Prisma.Decimal } | null,
): Prisma.Decimal {
  return enquiry.finalBudgetAmount ?? quotation?.totalAmount ?? enquiry.estimatedBudget ?? new Prisma.Decimal(0);
}

// The advance collected at the enquiry stage is real money already received, so it is carried into
// the new order as its opening ADVANCE receipt rather than left as a note on the enquiry — that is
// what puts it in the Payment Tracker's Advance Amount, Collected and Balance.
//
// Capped at the order's own total: a payment may never exceed what is owed
// (payments/service.ts assertPaymentAllowed), and an advance larger than a budget that has since
// been revised down must not fail the conversion.
function resolveOpeningAdvance(advanceAmount: Prisma.Decimal | null, orderTotal: Prisma.Decimal): number {
  const advance = Number(advanceAmount ?? 0);
  const total = Number(orderTotal);
  if (advance <= 0 || total <= 0) return 0;
  return Math.min(advance, total);
}

// Shared by convert() (explicit quotation picked by a user) and autoConvertFromEnquiry() (picked
// automatically, or none at all). Wrapped in a transaction: creating the order and seeding its task
// checklist from templates must succeed together — otherwise the order would exist with no tasks.
//
// Neither a quotation nor an event date is a pre-condition: an enquiry that reaches ORDER_CONFIRMED
// belongs in Orders and the Payment Tracker, and both can be filled in on the order afterwards.
async function buildOrderFromEnquiry(
  companyId: number,
  actorId: number,
  enquiry: {
    id: number;
    enquiryNumber: string;
    eventDate: Date | null;
    venue: string | null;
    notes: string | null;
    finalBudgetAmount: Prisma.Decimal | null;
    estimatedBudget: Prisma.Decimal | null;
    advanceAmount: Prisma.Decimal | null;
    customer: { id: number } | null;
  },
  quotation: { id: number; quotationNumber: string; version: number; totalAmount: Prisma.Decimal } | null,
) {
  // ORDER_CONFIRMED materialises the customer (enquiries/service.ts), so a linked customer must exist.
  if (!enquiry.customer) {
    throw new AppError(400, 'This enquiry has no linked customer. Confirm the order on the enquiry first.');
  }

  const existingOrder = await ordersRepository.findOrderByEnquiryId(companyId, enquiry.id);
  if (existingOrder) {
    throw new AppError(409, `This enquiry has already been converted to order "${existingOrder.orderNumber}".`);
  }

  const totalAmount = resolveOrderTotal(enquiry, quotation);
  const openingAdvance = resolveOpeningAdvance(enquiry.advanceAmount, totalAmount);
  const orderNumber = await generateDocumentNumber(companyId, SequenceType.ORDER);
  // Both numbers are allocated before the transaction opens — recordPayment requires its receipt
  // number to come from outside, and the sequence generator runs its own transaction.
  const receiptNumber = openingAdvance > 0 ? await generateDocumentNumber(companyId, SequenceType.RECEIPT) : null;

  const order = await prisma.$transaction(async (tx) => {
    const created = await ordersRepository.createOrder(
      {
        companyId,
        orderNumber,
        enquiryId: enquiry.id,
        quotationId: quotation?.id ?? null,
        customerId: enquiry.customer!.id,
        eventDate: enquiry.eventDate,
        venue: enquiry.venue,
        notes: enquiry.notes,
        totalAmount,
        paidAmount: 0,
        pendingAmount: totalAmount,
        status: OrderStatus.YET_TO_START,
      },
      tx,
    );

    await ordersRepository.seedOrderTasksFromTemplates(companyId, created.id, tx);
    // "payment/payment.md" §Business Rules — "Every confirmed order automatically creates a
    // Payment Tracker record." Created here, in the same transaction as the order, so the tracker
    // can never be missing for an order that exists.
    await paymentTrackerRepository.ensureTracker(created.id, tx);

    // The advance already collected on the enquiry, as the order's opening receipt. After
    // ensureTracker: recordPayment syncs the tracker's status, which needs the tracker to exist.
    // The enquiry form collects an amount only, so the method is recorded as Cash and can be
    // corrected from the Payment Tracker.
    if (receiptNumber) {
      await paymentsService.recordPayment(
        tx,
        { id: created.id, orderNumber, totalAmount, paidAmount: 0, pendingAmount: totalAmount },
        actorId,
        {
          amount: openingAdvance,
          paymentType: PaymentType.ADVANCE,
          paymentMethod: PaymentMethod.CASH,
          remarks: `Advance recorded on enquiry "${enquiry.enquiryNumber}".`,
        },
        receiptNumber,
      );
    }
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
    description:
      (quotation
        ? `Order "${order.orderNumber}" created from enquiry "${enquiry.enquiryNumber}" and quotation "${quotation.quotationNumber}" (v${quotation.version}).`
        : `Order "${order.orderNumber}" created from enquiry "${enquiry.enquiryNumber}" without a quotation.`) +
      (receiptNumber ? ` Advance of ${openingAdvance} carried over as receipt ${receiptNumber}.` : ''),
    performedById: actorId,
  });

  // Logged separately so the receipt shows on the Payments module's own trail too, matching a
  // collection recorded by hand (payments/service.ts create()).
  if (receiptNumber) {
    await logActivity({
      companyId,
      module: 'PAYMENTS',
      referenceId: order.id,
      action: 'CREATE',
      description: `Payment of ${openingAdvance} (ADVANCE) recorded for order "${order.orderNumber}" (receipt ${receiptNumber}), carried over from enquiry "${enquiry.enquiryNumber}".`,
      performedById: actorId,
    });
  }

  return order;
}

export async function convert(companyId: number, actorId: number, input: ConvertToOrderInput) {
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
  // No quotation-status gate: an Order Confirmed enquiry belongs in Orders regardless of where its
  // quotation got to (draft, shared, rejected). The enquiry's own status is the decision.

  return buildOrderFromEnquiry(companyId, actorId, enquiry, quotation);
}

// Automatic conversion, triggered the moment an enquiry reaches ORDER_CONFIRMED (see
// enquiries/service.ts changeStatus) so a confirmed enquiry doesn't need a separate manual "Create
// Order" step. The enquiry's status is the only pre-condition: it prefers the enquiry's approved
// quotation and otherwise takes its latest revision whatever state that is in, and raises the order
// with no quotation at all when none exists. Still never throws — a status change must not fail
// because the order behind it could not be built.
export async function autoConvertFromEnquiry(companyId: number, actorId: number, enquiryId: number) {
  const enquiry = await enquiriesRepository.findEnquiryById(companyId, enquiryId);
  if (!enquiry || enquiry.status !== EnquiryStatus.ORDER_CONFIRMED) return null;

  const existingOrder = await ordersRepository.findOrderByEnquiryId(companyId, enquiryId);
  if (existingOrder) return existingOrder;

  const approved = await quotationsRepository.findApprovedQuotationForEnquiry(companyId, enquiryId);
  const candidate = approved ?? (await quotationsRepository.findLatestQuotationForEnquiry(companyId, enquiryId));
  const quotation = candidate ? await quotationsRepository.findQuotationById(companyId, candidate.id) : null;

  try {
    return await buildOrderFromEnquiry(companyId, actorId, enquiry, quotation);
  } catch (error) {
    // Logged rather than silently discarded: this used to swallow every failure (not just the
    // documented "no linked customer" case), which left enquiries stuck at ORDER_CONFIRMED with
    // no order, no payment tracker, and no trace of why.
    console.error(`Auto-convert failed for enquiry ${enquiryId}:`, error);
    return null;
  }
}

/**
 * Re-applies an enquiry's money to the order already raised from it, after the enquiry's Final
 * Budget or Advance Amount was edited. Without this the two drift apart the moment an enquiry is
 * corrected post-confirmation, and the Orders/Payment modules keep reporting the figures that
 * happened to be there at conversion time.
 *
 * Budget follows resolveOrderTotal, exactly as it did at conversion. The advance is carried across
 * only when the order has no ADVANCE receipt yet, so editing the enquiry again never issues a
 * second receipt for the same money.
 *
 * No-ops (returns null) when the enquiry has no order — the ordinary case.
 */
export async function syncOrderFromEnquiry(companyId: number, actorId: number, enquiryId: number) {
  const order = await ordersRepository.findOrderByEnquiryId(companyId, enquiryId);
  if (!order) return null;

  const enquiry = await enquiriesRepository.findEnquiryById(companyId, enquiryId);
  if (!enquiry) return null;

  const quotation = order.quotationId
    ? await quotationsRepository.findQuotationById(companyId, order.quotationId)
    : null;

  const collected = Number(order.paidAmount);
  const nextTotal = resolveOrderTotal(enquiry, quotation);
  const budgetChanged = Number(nextTotal) !== Number(order.totalAmount);

  // The Payment Tracker's own rule (payment-tracker/service.ts update): a budget below what has
  // already been collected would leave a negative balance. Refused here too rather than silently
  // letting the enquiry and its order disagree.
  if (budgetChanged && Number(nextTotal) < collected) {
    throw new AppError(
      400,
      `The final budget cannot be less than the ${collected} already collected against order "${order.orderNumber}".`,
      [{ field: 'finalBudgetAmount', message: `Final budget must be at least ${collected}.` }],
    );
  }

  const pendingAfterBudget = Number(nextTotal) - collected;
  const alreadyAdvanced = (await paymentsRepository.countAdvancePayments(order.id)) > 0;
  const openingAdvance = alreadyAdvanced
    ? 0
    : Math.min(resolveOpeningAdvance(enquiry.advanceAmount, nextTotal), pendingAfterBudget);

  if (!budgetChanged && openingAdvance <= 0) return order;

  // Drawn outside the transaction — see numberGenerator.ts.
  const receiptNumber = openingAdvance > 0 ? await generateDocumentNumber(companyId, SequenceType.RECEIPT) : null;

  await prisma.$transaction(async (tx) => {
    if (budgetChanged) {
      await ordersRepository.updateOrder(
        order.id,
        { totalAmount: nextTotal, pendingAmount: pendingAfterBudget },
        tx,
      );
      // A raised budget can move a settled order back to part-paid, so the derived status follows
      // the new figure even when no money moved.
      await paymentTrackerRepository.syncTrackerStatus(order.id, Number(nextTotal), collected, tx);
    }

    if (receiptNumber) {
      await paymentTrackerRepository.ensureTracker(order.id, tx);
      await paymentsService.recordPayment(
        tx,
        {
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: nextTotal,
          paidAmount: collected,
          pendingAmount: pendingAfterBudget,
        },
        actorId,
        {
          amount: openingAdvance,
          paymentType: PaymentType.ADVANCE,
          paymentMethod: PaymentMethod.CASH,
          remarks: `Advance recorded on enquiry "${enquiry.enquiryNumber}".`,
        },
        receiptNumber,
      );
    }
  });

  const parts: string[] = [];
  if (budgetChanged) parts.push(`budget set to ${nextTotal} from enquiry "${enquiry.enquiryNumber}"`);
  if (receiptNumber) parts.push(`advance of ${openingAdvance} carried over as receipt ${receiptNumber}`);

  await logActivity({
    companyId,
    module: 'ORDERS',
    referenceId: order.id,
    action: 'UPDATE',
    description: `Order "${order.orderNumber}" ${parts.join(' and ')}.`,
    performedById: actorId,
  });

  return ordersRepository.findOrderById(companyId, order.id);
}

export async function update(companyId: number, actorId: number, id: number, input: UpdateOrderInput) {
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
  // An order raised from an enquiry that had no event date starts without one, so the first date
  // entered is recorded as a set rather than a change.
  let description = `Order "${existing.orderNumber}" updated.`;
  if (input.eventDate && previousEventDate?.getTime() !== input.eventDate.getTime()) {
    const newDate = input.eventDate.toISOString().slice(0, 10);
    description += previousEventDate
      ? ` Event date changed from ${previousEventDate.toISOString().slice(0, 10)} to ${newDate}.`
      : ` Event date set to ${newDate}.`;
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

export async function changeStatus(companyId: number, actorId: number, id: number, input: ChangeOrderStatusInput) {
  const existing = await ordersRepository.findOrderById(companyId, id);
  if (!existing) throw new AppError(404, 'Order not found.');

  // No workflow-order restriction and no balance guard: any status may be set from any other at
  // any time — payment standing is monitored separately in the Payment Tracker module, not gated
  // here. authorizeWhen (routes.ts) is still the permission check per target status.
  const order = await ordersRepository.updateOrder(id, {
    status: input.status,
    ...(input.status === OrderStatus.REJECTED ? { cancellationReason: input.cancellationReason } : {}),
  });

  let description = `Order "${existing.orderNumber}" status changed from ${existing.status} to ${input.status}.`;
  if (input.status === OrderStatus.REJECTED && input.cancellationReason) {
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
    // Recorded as data as well as prose: the Order Details progress tracker dates each stage from
    // the entry that moved the order into it, and must not have to parse the sentence above.
    metadata: { from: existing.status, to: input.status },
    performedById: actorId,
  });

  return order;
}
