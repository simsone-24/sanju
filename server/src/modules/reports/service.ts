import * as customersService from '../customers/service';
import { buildPaginationMeta } from '../../utils/pagination';
import * as reportsRepository from './repository';
import { CustomerReportParams, EventReportParams, OutstandingReportParams, RevenueReportParams } from './types';

export async function getRevenueReport(params: RevenueReportParams) {
  const { records, totalRecords, totalRevenue, methodBreakdown } = await reportsRepository.listPaymentsForRevenue(
    params,
  );
  return {
    data: {
      summary: { totalRevenue, paymentCount: totalRecords, methodBreakdown },
      payments: records,
    },
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}

export async function getOutstandingReport(params: OutstandingReportParams) {
  const { records, totalRecords, totalOutstanding } = await reportsRepository.listOutstandingOrders(params);
  return {
    data: {
      summary: { totalOutstanding, orderCount: totalRecords },
      orders: records,
    },
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}

// Reuses the Customers module's own list() wholesale — it already computes totalEvents/
// lastEvent/outstandingAmount per customer (see customers/service.ts), which is exactly what
// a Customer Report needs. No duplicated aggregation logic.
export async function getCustomerReport(params: CustomerReportParams) {
  const { records, meta } = await customersService.list(params);
  return { data: { customers: records }, meta };
}

export async function getEventReport(params: EventReportParams) {
  const { records, totalRecords, statusCounts } = await reportsRepository.listEventsReport(params);
  return {
    data: {
      summary: { totalEvents: totalRecords, statusCounts },
      events: records,
    },
    meta: buildPaginationMeta(params.page, params.limit, totalRecords),
  };
}
