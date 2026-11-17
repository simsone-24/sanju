import { EnquiryStatus, EventTime, SequenceType } from '@prisma/client';
import * as customersRepository from '../customers/repository';
import * as customersService from '../customers/service';
import * as ordersService from '../orders/service';
import * as quotationsService from '../quotations/service';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import { AuthenticatedUser } from '../auth/types';
import { ModuleName } from '../permissions/catalog';
import { requirePermission } from '../permissions/service';
import * as enquiriesRepository from './repository';
import {
  CreateEnquiryInput,
  CreateFollowUpInput,
  EnquiryStatsParams,
  EventDayInput,
  ListEnquiriesParams,
  UpdateEnquiryInput,
} from './types';

interface EventDay {
  eventDate: Date;
  eventTime: EventTime | null;
}

// Within a day, Morning runs before Evening; a day with no time set sorts last.
const EVENT_TIME_ORDER: Record<EventTime, number> = { MORNING: 0, EVENING: 1 };

/**
 * The event days a request carries, validated and put in order — or undefined when it says nothing
 * about them. `eventDays` wins; the older single eventDate / eventTime pair is read as one day so
 * existing API callers keep working. The same date may appear twice (a Morning and an Evening
 * session), but never with the same time.
 */
function resolveEventDays(input: {
  eventDays?: EventDayInput[];
  eventDate?: Date;
  eventTime?: EventTime;
}): EventDay[] | undefined {
  const requested: EventDayInput[] | undefined =
    input.eventDays ?? (input.eventDate ? [{ eventDate: input.eventDate, eventTime: input.eventTime }] : undefined);
  if (!requested) return undefined;

  const days: EventDay[] = requested.map((day) => ({ eventDate: day.eventDate, eventTime: day.eventTime ?? null }));
  const seen = new Set<string>();
  for (const day of days) {
    const key = `${day.eventDate.toISOString().slice(0, 10)}|${day.eventTime ?? ''}`;
    if (seen.has(key)) {
      throw new AppError(400, 'The same event date and time is entered more than once.', [
        { field: 'eventDays', message: 'Each event date and time can only be added once.' },
      ]);
    }
    seen.add(key);
  }

  return days.sort(
    (a, b) =>
      a.eventDate.getTime() - b.eventDate.getTime() ||
      (a.eventTime ? EVENT_TIME_ORDER[a.eventTime] : 2) - (b.eventTime ? EVENT_TIME_ORDER[b.eventTime] : 2),
  );
}

// Shape returned to the API: the linked customer and the prospect_* columns are normalised into a
// single `customer` object (id is null while the enquiry is still an unconfirmed prospect).
function mapEnquiryListItem<
  T extends {
    customer: { id: number; customerName: string; mobile: string | null } | null;
    prospectName: string | null;
    prospectMobile: string | null;
  },
>(row: T) {
  const { prospectName, prospectMobile, customer, ...rest } = row;
  return {
    ...rest,
    customer: customer
      ? { id: customer.id as number | null, customerName: customer.customerName, mobile: customer.mobile ?? '' }
      : { id: null, customerName: prospectName ?? '', mobile: prospectMobile ?? '' },
  };
}

function mapEnquiryDetail<
  T extends {
    customer: { id: number; customerName: string; mobile: string | null } | null;
    prospectName: string | null;
    prospectMobile: string | null;
    prospectWhatsapp: string | null;
    prospectEmail: string | null;
    prospectAddress: string | null;
    prospectCity: string | null;
    eventDays: { id: number; eventDate: Date; eventTime: EventTime | null }[];
  },
>(row: T) {
  const { prospectWhatsapp, prospectEmail, prospectAddress, prospectCity, eventDays, ...listPart } = row;
  const mapped = mapEnquiryListItem(listPart);
  // Editable prospect block, present only while the enquiry has no linked Customer yet.
  const prospect = row.customer
    ? null
    : {
        customerName: row.prospectName ?? '',
        mobile: row.prospectMobile ?? '',
        whatsapp: prospectWhatsapp,
        email: prospectEmail,
        address: prospectAddress,
        city: prospectCity,
      };
  // A day has no time of day, so it travels as a plain YYYY-MM-DD string — no timezone to shift it.
  const days = eventDays.map((day) => ({ ...day, eventDate: day.eventDate.toISOString().slice(0, 10) }));
  return { ...mapped, prospect, eventDays: days };
}

export async function list(params: ListEnquiriesParams) {
  const { records, totalRecords } = await enquiriesRepository.listEnquiries(params);
  return {
    records: records.map(mapEnquiryListItem),
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}

export async function getStats(params: EnquiryStatsParams) {
  return enquiriesRepository.getEnquiryStats(params);
}

export async function getById(companyId: number, id: number) {
  const enquiry = await enquiriesRepository.findEnquiryById(companyId, id);
  if (!enquiry) throw new AppError(404, 'Enquiry not found.');
  return mapEnquiryDetail(enquiry);
}

// Customer columns to persist on the enquiry itself. For an EXISTING customer we link its id
// immediately; for a NEW customer we DON'T create a Customer row yet (that happens only at
// ORDER_CONFIRMED) — the details are stored in the prospect_* columns until then.
type EnquiryCustomerColumns = {
  customerId: number | null;
  prospectName: string | null;
  prospectMobile: string | null;
  prospectWhatsapp: string | null;
  prospectEmail: string | null;
  prospectAddress: string | null;
  prospectCity: string | null;
};

async function resolveCustomerColumns(
  companyId: number,
  input: CreateEnquiryInput['customer'],
  client: PrismaClientOrTx,
): Promise<EnquiryCustomerColumns> {
  const emptyProspect = {
    prospectName: null,
    prospectMobile: null,
    prospectWhatsapp: null,
    prospectEmail: null,
    prospectAddress: null,
    prospectCity: null,
  };

  // A DRAFT saved before any customer type was picked at all.
  if (!input) {
    return { customerId: null, ...emptyProspect };
  }

  if (input.type === 'EXISTING') {
    if (!input.customerId) return { customerId: null, ...emptyProspect };
    const customer = await customersRepository.findCustomerById(companyId, input.customerId, client);
    if (!customer) {
      throw new AppError(400, 'Selected customer does not exist.', [
        { field: 'customer.customerId', message: 'Selected customer does not exist.' },
      ]);
    }
    return { customerId: customer.id, ...emptyProspect };
  }

  return {
    customerId: null,
    prospectName: input.customerName ?? null,
    prospectMobile: input.mobile ?? null,
    prospectWhatsapp: input.whatsapp ?? null,
    prospectEmail: input.email ?? null,
    prospectAddress: input.address ?? null,
    prospectCity: input.city ?? null,
  };
}

// An enquiry may be created directly at ANY of the 6 statuses (e.g. logging one that's already
// past its first contact, or booking a confirmed order in a single step). Creating directly at
// ORDER_CONFIRMED materialises the customer immediately — see create() below.
const VALID_INITIAL_STATUSES: EnquiryStatus[] = Object.values(EnquiryStatus);

// A customer already on file owns its phone / WhatsApp numbers, so an enquiry typed in as a NEW
// customer may not reuse one: the user must pick the existing customer instead, and the enquiry then
// carries that customer's details rather than a second copy of them.
async function assertProspectNumbersFree(
  companyId: number,
  numbers: { mobile?: string | null; whatsapp?: string | null },
  client: PrismaClientOrTx,
) {
  const checks = [
    { field: 'mobile', label: 'phone number', value: numbers.mobile, find: customersRepository.findCustomerByMobile },
    { field: 'whatsapp', label: 'WhatsApp number', value: numbers.whatsapp, find: customersRepository.findCustomerByWhatsapp },
  ] as const;

  for (const check of checks) {
    if (!check.value) continue;
    const customer = await check.find(companyId, check.value, client);
    if (customer) {
      const message = `Customer "${customer.customerName}" already exists with this ${check.label}. Select the existing customer instead of creating a new one.`;
      throw new AppError(409, message, [{ field: check.field, message }]);
    }
  }
}

// Finds an existing customer by mobile (never duplicating) or creates one from the given details.
// Shared by create() (direct ORDER_CONFIRMED) and confirmProspectCustomer() (status change).
async function findOrCreateCustomerId(
  companyId: number,
  details: { customerName: string; mobile?: string; whatsapp?: string; email?: string; address?: string; city?: string },
  client: PrismaClientOrTx,
): Promise<number> {
  // Phone numbers are optional but unique, so a number that is given identifies the customer; with
  // neither, a new customer is created from the name alone.
  const matched =
    (details.mobile ? await customersRepository.findCustomerByMobile(companyId, details.mobile, client) : null) ??
    (details.whatsapp ? await customersRepository.findCustomerByWhatsapp(companyId, details.whatsapp, client) : null);
  if (matched) return matched.id;
  const created = await customersService.create(companyId, details, client);
  return created.id;
}

export async function create(companyId: number, actorId: number, input: CreateEnquiryInput) {
  // Only checked when given — a DRAFT enquiry may be saved with no event type picked yet.
  if (input.eventTypeId) {
    const eventType = await enquiriesRepository.findEventTypeForCompany(companyId, input.eventTypeId);
    if (!eventType) {
      throw new AppError(400, 'Selected event type does not exist.', [
        { field: 'eventTypeId', message: 'Selected event type does not exist.' },
      ]);
    }
  }

  if (input.assignedUserId) {
    const user = await enquiriesRepository.findUserForCompany(companyId, input.assignedUserId);
    if (!user) {
      throw new AppError(400, 'Selected sales executive does not exist.', [
        { field: 'assignedUserId', message: 'Selected sales executive does not exist.' },
      ]);
    }
  }

  if (input.eventManagerId) {
    const manager = await enquiriesRepository.findUserForCompany(companyId, input.eventManagerId);
    if (!manager) {
      throw new AppError(400, 'Selected event manager does not exist.', [
        { field: 'eventManagerId', message: 'Selected event manager does not exist.' },
      ]);
    }
  }

  const eventDays = resolveEventDays(input);

  const initialStatus = input.status ?? EnquiryStatus.PENDING;
  if (!VALID_INITIAL_STATUSES.includes(initialStatus)) {
    throw new AppError(400, `Cannot create an enquiry directly at status ${initialStatus}.`, [
      { field: 'status', message: `Allowed initial status(es): ${VALID_INITIAL_STATUSES.join(', ')}.` },
    ]);
  }

  if (input.customer?.type === 'NEW') {
    await assertProspectNumbersFree(companyId, input.customer, prisma);
  }

  const enquiryNumber = await generateDocumentNumber(companyId, SequenceType.ENQUIRY);

  // Creating directly at ORDER_CONFIRMED with a NEW customer must create/link the Customer now
  // (there's no prospect stage to defer it to) — done in a transaction with the enquiry insert.
  const enquiry = await prisma.$transaction(async (tx) => {
    const customerColumns = await resolveCustomerColumns(companyId, input.customer, tx);
    // customerName/mobile are guaranteed present here — validation.ts requires them for any
    // non-DRAFT enquiry, which is the only case that can reach ORDER_CONFIRMED at creation.
    const finalColumns =
      initialStatus === EnquiryStatus.ORDER_CONFIRMED && input.customer?.type === 'NEW'
        ? {
            customerId: await findOrCreateCustomerId(
              companyId,
              {
                customerName: input.customer.customerName!,
                mobile: input.customer.mobile,
                whatsapp: input.customer.whatsapp,
                email: input.customer.email,
                address: input.customer.address,
                city: input.customer.city,
              },
              tx,
            ),
            prospectName: null,
            prospectMobile: null,
            prospectWhatsapp: null,
            prospectEmail: null,
            prospectAddress: null,
            prospectCity: null,
          }
        : customerColumns;

    return enquiriesRepository.createEnquiry(
      {
        companyId,
        enquiryNumber,
        ...finalColumns,
        eventTypeId: input.eventTypeId,
        eventName: input.eventName,
        // The earliest day is the enquiry's main date — see EnquiryEventDay in the schema.
        eventDate: eventDays?.[0]?.eventDate,
        eventTime: eventDays?.[0]?.eventTime,
        eventDays: eventDays?.length ? { create: eventDays } : undefined,
        mahal: input.mahal,
        venue: input.venue,
        estimatedBudget: input.estimatedBudget,
        finalBudgetAmount: input.finalBudgetAmount,
        advanceAmount: input.advanceAmount,
        notes: input.notes,
        appointmentDate: input.appointmentDate,
        appointmentTime: input.appointmentTime,
        meetingLocation: input.meetingLocation,
        appointmentNotes: input.appointmentNotes,
        appointmentStatus: input.appointmentStatus,
        assignedUserId: input.assignedUserId,
        eventManagerId: input.eventManagerId,
        followUpDate: input.followUpDate,
        status: initialStatus,
      },
      tx,
    );
  });

  await logActivity({
    companyId,
    module: 'ENQUIRIES',
    referenceId: enquiry.id,
    action: 'CREATE',
    description: `Enquiry "${enquiry.enquiryNumber}" created.`,
    performedById: actorId,
  });

  // Same auto-conversion as changeStatus() — an enquiry created directly at ORDER_CONFIRMED
  // shouldn't need a separate manual "Create Order" step either.
  if (initialStatus === EnquiryStatus.ORDER_CONFIRMED) {
    await ordersService.autoConvertFromEnquiry(companyId, actorId, enquiry.id);
  }

  return mapEnquiryDetail(enquiry);
}

export async function update(actor: AuthenticatedUser, id: number, input: UpdateEnquiryInput) {
  const companyId = actor.companyId;
  const existingEnquiry = await enquiriesRepository.findEnquiryById(companyId, id);
  if (!existingEnquiry) throw new AppError(404, 'Enquiry not found.');

  // masters/user.md §Enquiries lists Assign as a permission of its own. The assignee rides along in
  // every update payload, so it is the *change* that is guarded — someone with Edit but not Assign
  // can still edit an enquiry that is already assigned, they just cannot hand it to someone else.
  const requestedAssignee = input.assignedUserId ?? null;
  if (input.assignedUserId !== undefined && requestedAssignee !== (existingEnquiry.assignedUser?.id ?? null)) {
    requirePermission(actor, ModuleName.ENQUIRIES, 'canAssign');
  }

  if (input.eventTypeId) {
    const eventType = await enquiriesRepository.findEventTypeForCompany(companyId, input.eventTypeId);
    if (!eventType) {
      throw new AppError(400, 'Selected event type does not exist.', [
        { field: 'eventTypeId', message: 'Selected event type does not exist.' },
      ]);
    }
  }

  if (input.assignedUserId) {
    const user = await enquiriesRepository.findUserForCompany(companyId, input.assignedUserId);
    if (!user) {
      throw new AppError(400, 'Selected sales executive does not exist.', [
        { field: 'assignedUserId', message: 'Selected sales executive does not exist.' },
      ]);
    }
  }

  if (input.eventManagerId) {
    const manager = await enquiriesRepository.findUserForCompany(companyId, input.eventManagerId);
    if (!manager) {
      throw new AppError(400, 'Selected event manager does not exist.', [
        { field: 'eventManagerId', message: 'Selected event manager does not exist.' },
      ]);
    }
  }

  // Prospect (customer) fields are editable only while no Customer is linked yet; once linked, the
  // enquiry's customer is the immutable Customer Master record and these fields are ignored.
  const {
    customerName,
    mobile,
    whatsapp,
    email,
    address,
    city,
    eventDays: _eventDays,
    eventDate: _eventDate,
    eventTime,
    ...enquiryFields
  } = input;
  const eventDays = resolveEventDays(input);
  // The main date follows the days; a request that changes only the time of day (no date) leaves the
  // list alone and just updates the main time.
  const eventFields = eventDays
    ? { eventDate: eventDays[0]?.eventDate ?? null, eventTime: eventDays[0]?.eventTime ?? null }
    : eventTime !== undefined
      ? { eventTime }
      : {};
  // Only a number the user is changing is checked, so editing an old prospect enquiry whose number
  // has since become a customer's is not blocked for something it did not touch.
  if (!existingEnquiry.customer) {
    await assertProspectNumbersFree(
      companyId,
      {
        mobile: mobile !== existingEnquiry.prospectMobile ? mobile : undefined,
        whatsapp: whatsapp !== existingEnquiry.prospectWhatsapp ? whatsapp : undefined,
      },
      prisma,
    );
  }
  const prospectData = existingEnquiry.customer
    ? {}
    : {
        ...(customerName !== undefined ? { prospectName: customerName } : {}),
        ...(mobile !== undefined ? { prospectMobile: mobile } : {}),
        ...(whatsapp !== undefined ? { prospectWhatsapp: whatsapp } : {}),
        ...(email !== undefined ? { prospectEmail: email ?? null } : {}),
        ...(address !== undefined ? { prospectAddress: address ?? null } : {}),
        ...(city !== undefined ? { prospectCity: city ?? null } : {}),
      };

  const enquiry = await prisma.$transaction(async (tx) => {
    if (eventDays) await enquiriesRepository.replaceEventDays(id, eventDays, tx);
    return enquiriesRepository.updateEnquiry(id, { ...enquiryFields, ...eventFields, ...prospectData }, tx);
  });

  await logActivity({
    companyId,
    module: 'ENQUIRIES',
    referenceId: id,
    action: 'UPDATE',
    description: `Enquiry "${existingEnquiry.enquiryNumber}" updated.`,
    performedById: actor.id,
  });

  // The enquiry's Advance and the quotation's Advance are one figure. Mirror the edit onto the
  // current quotation (and its PDF) before the order sync below seeds any opening receipt from it.
  if (input.advanceAmount !== undefined) {
    await quotationsService.syncAdvanceFromEnquiry(companyId, id, input.advanceAmount, actor.id);
  }

  // The enquiry's money is the order's money: correcting the Final Budget or Advance after the
  // enquiry was already confirmed has to reach the order and its Payment Tracker, not just sit on
  // the enquiry. No-ops when there is no order yet.
  if (input.finalBudgetAmount !== undefined || input.advanceAmount !== undefined) {
    await ordersService.syncOrderFromEnquiry(companyId, actor.id, id);
  }

  return mapEnquiryDetail(enquiry);
}

export async function changeStatus(
  companyId: number,
  actorId: number,
  id: number,
  targetStatus: EnquiryStatus,
  remarks?: string,
) {
  const existingEnquiry = await enquiriesRepository.findEnquiryById(companyId, id);
  if (!existingEnquiry) throw new AppError(404, 'Enquiry not found.');

  // No current-status check: callers may move an enquiry to any status regardless of its existing one.

  // Reaching ORDER_CONFIRMED is the moment a prospect becomes a real customer: create the Customer
  // record from the prospect_* details (or link an existing one matched by mobile) and attach it to
  // the enquiry, all in one transaction with the status flip. EXISTING-customer enquiries already
  // have a linked customer, so this is skipped for them.
  const enquiry =
    targetStatus === EnquiryStatus.ORDER_CONFIRMED && !existingEnquiry.customer
      ? await confirmProspectCustomer(companyId, existingEnquiry, id, targetStatus)
      : await enquiriesRepository.updateEnquiryStatus(id, targetStatus);

  await logActivity({
    companyId,
    module: 'ENQUIRIES',
    referenceId: id,
    action: 'STATUS_CHANGE',
    description: `Enquiry "${existingEnquiry.enquiryNumber}" status changed from ${existingEnquiry.status} to ${targetStatus}.${remarks ? ` Remarks: ${remarks}` : ''}`,
    performedById: actorId,
  });

  // Reaching ORDER_CONFIRMED should land the enquiry in the Orders module without a separate
  // manual conversion step. Best-effort: never lets a missing quotation/event date fail the
  // status change itself — see ordersService.autoConvertFromEnquiry.
  if (targetStatus === EnquiryStatus.ORDER_CONFIRMED) {
    await ordersService.autoConvertFromEnquiry(companyId, actorId, id);
  }

  return mapEnquiryDetail(enquiry);
}

// Materialises an unconfirmed prospect into a Customer and links it to the enquiry, atomically
// with the status flip to ORDER_CONFIRMED. If a customer with the same mobile already exists, it
// links that one instead of creating a duplicate (honouring the "never duplicate customer" rule).
async function confirmProspectCustomer(
  companyId: number,
  existingEnquiry: { prospectName: string | null; prospectMobile: string | null; prospectWhatsapp: string | null; prospectEmail: string | null; prospectAddress: string | null; prospectCity: string | null },
  id: number,
  targetStatus: EnquiryStatus,
) {
  if (!existingEnquiry.prospectName) {
    throw new AppError(400, 'This enquiry has no customer details to confirm.');
  }

  return prisma.$transaction(async (tx) => {
    const customerId = await findOrCreateCustomerId(
      companyId,
      {
        customerName: existingEnquiry.prospectName!,
        mobile: existingEnquiry.prospectMobile ?? undefined,
        whatsapp: existingEnquiry.prospectWhatsapp ?? undefined,
        email: existingEnquiry.prospectEmail ?? undefined,
        address: existingEnquiry.prospectAddress ?? undefined,
        city: existingEnquiry.prospectCity ?? undefined,
      },
      tx,
    );

    return enquiriesRepository.updateEnquiry(id, { customerId, status: targetStatus }, tx);
  });
}

// "md files/Enquiry/enq.md" §8 — the enquiry's complete history, including the activity of the
// quotations and order that descend from it (see repository.getEnquiryTimeline).
export async function getTimeline(companyId: number, id: number) {
  const existingEnquiry = await enquiriesRepository.findEnquiryById(companyId, id);
  if (!existingEnquiry) throw new AppError(404, 'Enquiry not found.');

  return enquiriesRepository.getEnquiryTimeline(companyId, id);
}

/**
 * Deletes an enquiry and everything raised from it — its quotations, the order it became, and that
 * order's payments, invoice, payment tracker, task plan and documents (repository
 * softDeleteEnquiryCascade). Soft delete throughout, so the records stay auditable and the activity
 * log continues to resolve.
 *
 * There is deliberately no "still referenced" guard: a delete here is understood to take the whole
 * chain with it. The cascade is what makes that safe — nothing is left pointing at a hidden parent.
 */
export async function remove(actor: AuthenticatedUser, id: number): Promise<void> {
  const existingEnquiry = await enquiriesRepository.findEnquiryById(actor.companyId, id);
  if (!existingEnquiry) throw new AppError(404, 'Enquiry not found.');

  const { orderCount, quotationCount } = await enquiriesRepository.softDeleteEnquiryCascade(actor.companyId, id);

  // The counts go in the log line: after the fact, "which order did this take with it" is exactly
  // what someone auditing the deletion needs, and the deleted rows no longer surface anywhere else.
  const cascaded = [
    quotationCount > 0 ? `${quotationCount} quotation(s)` : null,
    orderCount > 0 ? `${orderCount} order(s)` : null,
  ].filter((part): part is string => part !== null);

  await logActivity({
    companyId: actor.companyId,
    module: 'ENQUIRIES',
    referenceId: id,
    action: 'DELETE',
    description: `Enquiry "${existingEnquiry.enquiryNumber}" deleted${
      cascaded.length ? `, along with ${cascaded.join(' and ')}` : ''
    }.`,
    performedById: actor.id,
  });
}

export async function addFollowUp(
  companyId: number,
  actorId: number,
  enquiryId: number,
  input: CreateFollowUpInput,
) {
  const existingEnquiry = await enquiriesRepository.findEnquiryById(companyId, enquiryId);
  if (!existingEnquiry) throw new AppError(404, 'Enquiry not found.');

  const followUp = await enquiriesRepository.createFollowUp({
    enquiryId,
    followUpDate: input.followUpDate,
    notes: input.notes,
    outcome: input.outcome,
    createdById: actorId,
  });

  await logActivity({
    companyId,
    module: 'ENQUIRIES',
    referenceId: enquiryId,
    action: 'FOLLOW_UP_ADDED',
    description: `Follow-up added for enquiry "${existingEnquiry.enquiryNumber}".`,
    performedById: actorId,
  });

  return followUp;
}
