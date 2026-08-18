import { SequenceType } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { logActivity } from '../../utils/activityLogger';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import * as customersRepository from './repository';
import { CreateCustomerInput, ListCustomersParams, UpdateCustomerInput } from './types';

// Not exposed via its own route (customers are auto-created, never manually — see
// 02_BUSINESS_WORKFLOW.md §10). Called internally by the Enquiry module's "new customer" path.
// Accepts an optional transaction client so the caller (e.g. Enquiry creation) can wrap
// customer creation and the record that references it in one atomic transaction — otherwise
// a failure downstream would leave an orphaned customer row behind.
export async function create(companyId: number, input: CreateCustomerInput, client: PrismaClientOrTx = prisma) {
  const existing = await customersRepository.findCustomerByMobile(companyId, input.mobile, client);
  if (existing) {
    throw new AppError(409, `A customer with mobile number ${input.mobile} already exists.`, [
      {
        field: 'mobile',
        message: `Customer "${existing.customerName}" already exists with this mobile number. Select the existing customer instead of creating a new one.`,
      },
    ]);
  }

  const customerCode = await generateDocumentNumber(companyId, SequenceType.CUSTOMER);

  return customersRepository.createCustomer(
    {
      companyId,
      customerCode,
      customerName: input.customerName,
      mobile: input.mobile,
      whatsapp: input.whatsapp,
      email: input.email,
      address: input.address,
      city: input.city,
      status: 'ACTIVE',
    },
    client,
  );
}

export async function list(params: ListCustomersParams) {
  const { records, totalRecords } = await customersRepository.listCustomers(params);

  const statsMap = await customersRepository.getOrderStatsForCustomers(
    records.map((record) => record.id),
    new Date(),
  );

  const enriched = records.map((record) => ({
    ...record,
    ...(statsMap.get(record.id) ?? { totalEvents: 0, lastEvent: null, outstandingAmount: 0 }),
  }));

  return { records: enriched, meta: buildPaginationMeta(params.page, params.limit, totalRecords) };
}

export async function getById(companyId: number, id: number) {
  const customer = await customersRepository.findCustomerById(companyId, id);
  if (!customer) throw new AppError(404, 'Customer not found.');

  const statsMap = await customersRepository.getOrderStatsForCustomers([id], new Date());
  const stats = statsMap.get(id) ?? { totalEvents: 0, lastEvent: null, outstandingAmount: 0 };

  return { ...customer, ...stats };
}

// Edits the customer master directly — the enquiry workflow still creates and links customers on
// its own (create() above), but once a customer is linked to an enquiry, correcting a typo'd name
// or an outdated phone number has nowhere else to happen: the enquiry never duplicates these
// fields onto itself ("never duplicate customer information").
export async function update(companyId: number, actorId: number, id: number, input: UpdateCustomerInput) {
  const existing = await customersRepository.findCustomerById(companyId, id);
  if (!existing) throw new AppError(404, 'Customer not found.');

  if (input.mobile && input.mobile !== existing.mobile) {
    const duplicate = await customersRepository.findCustomerByMobile(companyId, input.mobile);
    if (duplicate && duplicate.id !== id) {
      throw new AppError(409, `A customer with mobile number ${input.mobile} already exists.`, [
        {
          field: 'mobile',
          message: `Customer "${duplicate.customerName}" already exists with this mobile number.`,
        },
      ]);
    }
  }

  const customer = await customersRepository.updateCustomer(id, input);

  await logActivity({
    companyId,
    module: 'CUSTOMERS',
    referenceId: id,
    action: 'UPDATE',
    description: `Customer "${existing.customerName}" updated.`,
    performedById: actorId,
  });

  const statsMap = await customersRepository.getOrderStatsForCustomers([id], new Date());
  const stats = statsMap.get(id) ?? { totalEvents: 0, lastEvent: null, outstandingAmount: 0 };

  return { ...customer, ...stats };
}

export async function getHistory(companyId: number, id: number) {
  const customer = await customersRepository.findCustomerById(companyId, id);
  if (!customer) throw new AppError(404, 'Customer not found.');

  const now = new Date();
  const [orders, payments] = await Promise.all([
    customersRepository.getCustomerOrders(id),
    customersRepository.getCustomerPayments(id),
  ]);

  // An order whose event date isn't set yet (confirmed before one was known) is neither past nor
  // upcoming, so it sits in neither list until a date is entered on the order.
  return {
    previousEvents: orders.filter((order) => order.eventDate !== null && order.eventDate < now),
    upcomingEvents: orders.filter((order) => order.eventDate !== null && order.eventDate >= now),
    payments,
  };
}
