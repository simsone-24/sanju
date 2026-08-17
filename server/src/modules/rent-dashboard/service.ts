import { RentPaymentStatus, StockReturnStatus } from '@prisma/client';
import * as rentPaymentsRepository from '../rent-payments/repository';
import * as returnsRepository from '../rent-returns/repository';
import * as stockOutsRepository from '../rent-stock-outs/repository';
import { mapStockOutSummary, type StockOutSummaryResponse } from '../rent-stock-outs/service';
import { roundQuantity } from '../rent-stock-outs/status';

/** How many rows each dashboard panel shows. The panels are a prompt to act, not a report. */
const PANEL_SIZE = 5;

export interface RentDashboardResponse {
  returns: returnsRepository.ReturnSummaryTotals & { totalPendingQuantity: number };
  payments: rentPaymentsRepository.RentPaymentSummaryTotals;
  recentStockOuts: StockOutSummaryResponse[];
  pendingReturns: StockOutSummaryResponse[];
  pendingPayments: StockOutSummaryResponse[];
}

/**
 * The Rent dashboard (stock.md §26): the return and payment counters, the latest transactions, and
 * the two "needs attention" panels.
 *
 * Composed from the modules that own each figure rather than re-querying them here, so a counter on
 * this page can never disagree with the same counter on the module's own screen.
 */
export async function getDashboard(companyId: string): Promise<RentDashboardResponse> {
  const pendingReturnStatuses = [StockReturnStatus.NOT_RETURNED, StockReturnStatus.PARTIAL_RETURNED];
  const pendingPaymentStatuses = [RentPaymentStatus.UNPAID, RentPaymentStatus.PARTIALLY_PAID];

  const [returns, payments, recentStockOuts, pendingReturns, pendingPayments] = await Promise.all([
    returnsRepository.getReturnSummary(companyId),
    rentPaymentsRepository.getPaymentSummary(companyId),
    stockOutsRepository.findStockOutsFiltered({ companyId }, PANEL_SIZE),
    // Soonest expected return first — the ones already due, or due next, are the ones to chase.
    // Nulls sort last in MySQL under `asc`, which is the wanted order: a stock out with no promised
    // date is not overdue.
    stockOutsRepository.findStockOutsFiltered({ companyId, returnStatusIn: pendingReturnStatuses }, PANEL_SIZE, [
      { expectedReturnDate: 'asc' },
      { stockOutDate: 'asc' },
    ]),
    // Largest outstanding balance is not a sortable column (balance is grandTotal − paidAmount, not
    // a stored field), so the oldest unsettled transactions lead instead.
    stockOutsRepository.findStockOutsFiltered({ companyId, paymentStatusIn: pendingPaymentStatuses }, PANEL_SIZE, [
      { stockOutDate: 'asc' },
    ]),
  ]);

  return {
    returns: {
      ...returns,
      totalPendingQuantity: roundQuantity(returns.totalIssuedQuantity - returns.totalReturnedQuantity),
    },
    payments,
    recentStockOuts: recentStockOuts.map(mapStockOutSummary),
    pendingReturns: pendingReturns.map(mapStockOutSummary),
    pendingPayments: pendingPayments.map(mapStockOutSummary),
  };
}
