import { EnquiryStatus, SequenceType } from '@prisma/client';
import * as customersRepository from '../customers/repository';
import * as customersService from '../customers/service';
import * as ordersService from '../orders/service';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import { AuthenticatedUser } from '../auth/types';
import { ModuleName } from '../permissions/catalog';
import { requirePermission } from '../permissions/service';
import * as enquiriesRepository from './repository';
import { CreateEnquiryInput, CreateFollowUpInput, ListEnquiriesParams, UpdateEnquiryInput } from './types';

// Shape returned to the API: the linked customer and the prospect_* columns are normalised into a
// single `customer` object (id is null while the enquiry is still an unconfirmed prospect).
function mapEnquiryListItem<
  T extends {
    customer: { id: string; customerName: string; mobile: string } | null;
    prospectName: string | null;
    prospectMobile: string | null;
  },
>(row: T) {
  const { prospectName, prospectMobile, customer, ...rest } = row;
  return {
    ...rest,
    customer: customer
      ? { id: customer.id as string | null, customerName: customer.customerName, mobile: customer.mobile }
      : { id: null, customerName: prospectName ?? '', mobile: prospectMobile ?? '' },
  };
}

function mapEnquiryDetail<
  T extends {
    customer: { id: string; customerName: string; mobile: string } | null;
    prospectName: string | null;
    prospectMobile: string | null;
    prospectWhatsapp: string | null;
    prospectEmail: string | null;
    prospectAddress: string | null;
    prospectCity: string | null;
  },
>(row: T) {
  const { prospectWhatsapp, prospectEmail, prospectAddress, prospectCity, ...listPart } = row;
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
  return { ...mapped, prospect };
}

export async function list(params: ListEnquiriesParams) {
  const { records, totalRecords } = await enquiriesRepository.listEnquiries(params);
  return {
    records: records.map(mapEnquiryListItem),
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}

export async function getStats(companyId: string) {
  return enquiriesRepository.getEnquiryStats(companyId);
}

export async function getById(companyId: string, id: string) {
  const enquiry = await enquiriesRepository.findEnquiryById(companyId, id);
  if (!enquiry) throw new AppError(404, 'Enquiry not found.');
  return mapEnquiryDetail(enquiry);
}

// Customer columns to persist on the enquiry itself. For an EXISTING customer we link its id
// immediately; for a NEW customer we DON'T create a Customer row yet (that happens only at
// ORDER_CONFIRMED) — the details are stored in the prospect_* columns until then.
type EnquiryCustomerColumns = {
  customerId: string | null;
  prospectName: string | null;
  prospectMobile: string | null;
  prospectWhatsapp: string | null;
  prospectEmail: string | null;
  prospectAddress: string | null;
  prospectCity: string | null;
};

async function resolveCustomerColumns(
  companyId: string,
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

  if (input.type === 'EXISTING') {
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
    prospectName: input.customerName,
    prospectMobile: input.mobile,
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

// Finds an existing customer by mobile (never duplicating) or creates one from the given details.
// Shared by create() (direct ORDER_CONFIRMED) and confirmProspectCustomer() (status change).
async function findOrCreateCustomerId(
  companyId: string,
  details: { customerName: string; mobile: string; whatsapp?: string; email?: string; address?: string; city?: string },
  client: PrismaClientOrTx,
): Promise<string> {
  const matched = await customersRepository.findCustomerByMobile(companyId, details.mobile, client);
  if (matched) return matched.id;
  const created = await customersService.create(companyId, details, client);
  return created.id;
}

export async function create(companyId: string, actorId: string, input: CreateEnquiryInput) {
  const eventType = await enquiriesRepository.findEventTypeForCompany(companyId, input.eventTypeId);
  if (!eventType) {
    throw new AppError(400, 'Selected event type does not exist.', [
      { field: 'eventTypeId', message: 'Selected event type does not exist.' },
    ]);
  }

  if (input.assignedUserId) {
    const user = await enquiriesRepository.findUserForCompany(companyId, input.assignedUserId);
    if (!user) {
      throw new AppError(400, 'Selected sales executive does not exist.', [
        { field: 'assignedUserId', message: 'Selected sales executive does not exist.' },
      ]);
    }
  }

  const initialStatus = input.status ?? EnquiryStatus.PENDING;
  if (!VALID_INITIAL_STATUSES.includes(initialStatus)) {
    throw new AppError(400, `Cannot create an enquiry directly at status ${initialStatus}.`, [
      { field: 'status', message: `Allowed initial status(es): ${VALID_INITIAL_STATUSES.join(', ')}.` },
    ]);
  }

  const enquiryNumber = await generateDocumentNumber(companyId, SequenceType.ENQUIRY);

  // Creating directly at ORDER_CONFIRMED with a NEW customer must create/link the Customer now
  // (there's no prospect stage to defer it to) — done in a transaction with the enquiry insert.
  const enquiry = await prisma.$transaction(async (tx) => {
    const customerColumns = await resolveCustomerColumns(companyId, input.customer, tx);
    const finalColumns =
      initialStatus === EnquiryStatus.ORDER_CONFIRMED && input.customer.type === 'NEW'
        ? {
            customerId: await findOrCreateCustomerId(
              companyId,
              {
                customerName: input.customer.customerName,
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
        eventDate: input.eventDate,
        mahal: input.mahal,
        venue: input.venue,
        estimatedBudget: input.estimatedBudget,
        notes: input.notes,
        appointmentDate: input.appointmentDate,
        appointmentTime: input.appointmentTime,
        meetingLocation: input.meetingLocation,
        appointmentNotes: input.appointmentNotes,
        appointmentStatus: input.appointmentStatus,
        assignedUserId: input.assignedUserId,
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

export async function update(actor: AuthenticatedUser, id: string, input: UpdateEnquiryInput) {
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

  // Prospect (customer) fields are editable only while no Customer is linked yet; once linked, the
  // enquiry's customer is the immutable Customer Master record and these fields are ignored.
  const { customerName, mobile, whatsapp, email, address, city, ...enquiryFields } = input;
  const prospectData = existingEnquiry.customer
    ? {}
    : {
        ...(customerName !== undefined ? { prospectName: customerName } : {}),
        ...(mobile !== undefined ? { prospectMobile: mobile } : {}),
        ...(whatsapp !== undefined ? { prospectWhatsapp: whatsapp ?? null } : {}),
        ...(email !== undefined ? { prospectEmail: email ?? null } : {}),
        ...(address !== undefined ? { prospectAddress: address ?? null } : {}),
        ...(city !== undefined ? { prospectCity: city ?? null } : {}),
      };

  const enquiry = await enquiriesRepository.updateEnquiry(id, { ...enquiryFields, ...prospectData });

  await logActivity({
    companyId,
    module: 'ENQUIRIES',
    referenceId: id,
    action: 'UPDATE',
    description: `Enquiry "${existingEnquiry.enquiryNumber}" updated.`,
    performedById: actor.id,
  });

  return mapEnquiryDetail(enquiry);
}

export async function changeStatus(
  companyId: string,
  actorId: string,
  id: string,
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
  companyId: string,
  existingEnquiry: { prospectName: string | null; prospectMobile: string | null; prospectWhatsapp: string | null; prospectEmail: string | null; prospectAddress: string | null; prospectCity: string | null },
  id: string,
  targetStatus: EnquiryStatus,
) {
  if (!existingEnquiry.prospectName || !existingEnquiry.prospectMobile) {
    throw new AppError(400, 'This enquiry has no customer details to confirm.');
  }

  return prisma.$transaction(async (tx) => {
    const customerId = await findOrCreateCustomerId(
      companyId,
      {
        customerName: existingEnquiry.prospectName!,
        mobile: existingEnquiry.prospectMobile!,
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

export async function addFollowUp(
  companyId: string,
  actorId: string,
  enquiryId: string,
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
