import { SequenceType } from '@prisma/client';
import { PrismaClientOrTx, prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { generateDocumentNumber } from '../../utils/numberGenerator';
import { buildPaginationMeta } from '../../utils/pagination';
import * as customersRepository from './repository';
import { CreateCustomerInput, ListCustomersParams } from './types';

// Not exposed via its own route (customers are auto-created, never manually — see
// 02_BUSINESS_WORKFLOW.md §10). Called internally by the Enquiry module's "new customer" path.
// Accepts an optional transaction client so the caller (e.g. Enquiry creation) can wrap
// customer creation and the record that references it in one atomic transaction — otherwise
// a failure downstream would leave an orphaned customer row behind.
export async function create(companyId: string, input: CreateCustomerInput, client: PrismaClientOrTx = prisma) {
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

export async function getById(companyId: string, id: string) {
  const customer = await customersRepository.findCustomerById(companyId, id);
  if (!customer) throw new AppError(404, 'Customer not found.');

  const statsMap = await customersRepository.getOrderStatsForCustomers([id], new Date());
  const stats = statsMap.get(id) ?? { totalEvents: 0, lastEvent: null, outstandingAmount: 0 };

  return { ...customer, ...stats };
}

export async function getHistory(companyId: string, id: string) {
  const customer = await customersRepository.findCustomerById(companyId, id);
  if (!customer) throw new AppError(404, 'Customer not found.');

  const now = new Date();
  const [orders, payments] = await Promise.all([
    customersRepository.getCustomerOrders(id),
    customersRepository.getCustomerPayments(id),
  ]);

  return {
    previousEvents: orders.filter((order) => order.eventDate < now),
    upcomingEvents: orders.filter((order) => order.eventDate >= now),
    payments,
  };
}
