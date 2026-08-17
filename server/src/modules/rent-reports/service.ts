import { StockReturnStatus } from '@prisma/client';
import * as rentPersonsRepository from '../rent-persons/repository';
import * as stockOutsRepository from '../rent-stock-outs/repository';
import { mapStockOutItem, mapStockOutSummary, type StockOutSummaryResponse } from '../rent-stock-outs/service';
import { roundCurrency, roundQuantity } from '../rent-stock-outs/status';
import * as rentReportsRepository from './repository';
import {
  PaymentReportQuerySchema,
  PendingReturnReportQuerySchema,
  PersonSummaryReportQuerySchema,
  ReturnReportQuerySchema,
  StockOutReportQuerySchema,
} from './validation';

/**
 * Reports render a whole filtered result set rather than a page of it, so every query is capped.
 * Past the cap the response says so instead of silently showing a partial answer the reader would
 * take for the total.
 */
const REPORT_ROW_LIMIT = 1000;

export interface ReportEnvelope<TRow, TTotals> {
  rows: TRow[];
  totals: TTotals;
  /** True when the filters matched more rows than the cap — narrow the date range to see them all. */
  truncated: boolean;
  rowLimit: number;
}

// ---------------------------------------------------------------------------
// Stock Out report (stock.md §27 — Stock Out Report)
// ---------------------------------------------------------------------------

export interface StockOutReportRow extends StockOutSummaryResponse {
  items: { itemName: string; quantity: number; rate: number; amount: number }[];
}

export interface StockOutReportTotals {
  stockOuts: number;
  quantity: number;
  amount: number;
  paid: number;
  balance: number;
}

export async function stockOutReport(
  companyId: string,
  query: StockOutReportQuerySchema,
): Promise<ReportEnvelope<StockOutReportRow, StockOutReportTotals>> {
  const filters = {
    companyId,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    rentalPersonId: query.rentalPersonId,
    rentalItemId: query.rentalItemId,
    search: query.search,
  };

  const records = await stockOutsRepository.listStockOutsForReport(filters, REPORT_ROW_LIMIT + 1);
  const truncated = records.length > REPORT_ROW_LIMIT;
  const page = truncated ? records.slice(0, REPORT_ROW_LIMIT) : records;

  const rows: StockOutReportRow[] = page.map((record) => ({
    ...mapStockOutSummary(record),
    items: record.items.map(mapStockOutItem).map((item) => ({
      itemName: item.itemName,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    })),
  }));

  return {
    rows,
    totals: {
      stockOuts: rows.length,
      quantity: roundQuantity(rows.reduce((sum, row) => sum + row.issuedQuantity, 0)),
      amount: roundCurrency(rows.reduce((sum, row) => sum + row.grandTotal, 0)),
      paid: roundCurrency(rows.reduce((sum, row) => sum + row.paidAmount, 0)),
      balance: roundCurrency(rows.reduce((sum, row) => sum + row.balanceAmount, 0)),
    },
    truncated,
    rowLimit: REPORT_ROW_LIMIT,
  };
}

// ---------------------------------------------------------------------------
// Stock Return report (stock.md §27 — Stock Return Report)
// ---------------------------------------------------------------------------

export interface ReturnReportRow {
  id: string;
  rentNo: string;
  stockOutDate: Date;
  expectedReturnDate: Date | null;
  personName: string;
  personPhone: string;
  issuedQuantity: number;
  returnedQuantity: number;
  pendingQuantity: number;
  returnStatus: string;
}

export interface ReturnReportTotals {
  stockOuts: number;
  issued: number;
  returned: number;
  pending: number;
}

export async function returnReport(
  companyId: string,
  query: ReturnReportQuerySchema,
): Promise<ReportEnvelope<ReturnReportRow, ReturnReportTotals>> {
  const records = await stockOutsRepository.findStockOutsFiltered(
    {
      companyId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      rentalPersonId: query.rentalPersonId,
      rentalItemId: query.rentalItemId,
      returnStatus: query.returnStatus,
      search: query.search,
    },
    REPORT_ROW_LIMIT + 1,
  );

  const truncated = records.length > REPORT_ROW_LIMIT;
  const page = truncated ? records.slice(0, REPORT_ROW_LIMIT) : records;

  const rows: ReturnReportRow[] = page.map((record) => {
    const summary = mapStockOutSummary(record);
    return {
      id: summary.id,
      rentNo: summary.rentNo,
      stockOutDate: summary.stockOutDate,
      expectedReturnDate: summary.expectedReturnDate,
      personName: summary.rentalPerson.name,
      personPhone: summary.rentalPerson.phone,
      issuedQuantity: summary.issuedQuantity,
      returnedQuantity: summary.returnedQuantity,
      pendingQuantity: summary.pendingQuantity,
      returnStatus: summary.returnStatus,
    };
  });

  return {
    rows,
    totals: {
      stockOuts: rows.length,
      issued: roundQuantity(rows.reduce((sum, row) => sum + row.issuedQuantity, 0)),
      returned: roundQuantity(rows.reduce((sum, row) => sum + row.returnedQuantity, 0)),
      pending: roundQuantity(rows.reduce((sum, row) => sum + row.pendingQuantity, 0)),
    },
    truncated,
    rowLimit: REPORT_ROW_LIMIT,
  };
}

// ---------------------------------------------------------------------------
// Pending Return report (stock.md §27 — Pending Return Report)
// ---------------------------------------------------------------------------

/** Item-level, unlike the report above: this one answers "what exactly is still out there". */
export interface PendingReturnReportRow {
  stockOutId: string;
  rentNo: string;
  personName: string;
  personPhone: string;
  expectedReturnDate: Date | null;
  itemName: string;
  issuedQuantity: number;
  returnedQuantity: number;
  balanceQuantity: number;
}

export interface PendingReturnReportTotals {
  lines: number;
  issued: number;
  returned: number;
  balance: number;
}

export async function pendingReturnReport(
  companyId: string,
  query: PendingReturnReportQuerySchema,
): Promise<ReportEnvelope<PendingReturnReportRow, PendingReturnReportTotals>> {
  const records = await stockOutsRepository.listStockOutsForReport(
    {
      companyId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      rentalPersonId: query.rentalPersonId,
      rentalItemId: query.rentalItemId,
      returnStatusIn: [StockReturnStatus.NOT_RETURNED, StockReturnStatus.PARTIAL_RETURNED],
      search: query.search,
    },
    REPORT_ROW_LIMIT + 1,
  );

  const truncated = records.length > REPORT_ROW_LIMIT;
  const page = truncated ? records.slice(0, REPORT_ROW_LIMIT) : records;

  const rows: PendingReturnReportRow[] = [];
  for (const record of page) {
    for (const rawItem of record.items) {
      const item = mapStockOutItem(rawItem);
      // A fully returned line inside a partially returned stock out is not pending — the report
      // lists what is still out, not every line of every unsettled transaction.
      if (item.balanceQuantity <= 0) continue;

      rows.push({
        stockOutId: record.id,
        rentNo: record.rentNo,
        personName: record.rentalPerson.name,
        personPhone: record.rentalPerson.phone,
        expectedReturnDate: record.expectedReturnDate,
        itemName: item.itemName,
        issuedQuantity: item.quantity,
        returnedQuantity: item.returnedQuantity,
        balanceQuantity: item.balanceQuantity,
      });
    }
  }

  return {
    rows,
    totals: {
      lines: rows.length,
      issued: roundQuantity(rows.reduce((sum, row) => sum + row.issuedQuantity, 0)),
      returned: roundQuantity(rows.reduce((sum, row) => sum + row.returnedQuantity, 0)),
      balance: roundQuantity(rows.reduce((sum, row) => sum + row.balanceQuantity, 0)),
    },
    truncated,
    rowLimit: REPORT_ROW_LIMIT,
  };
}

// ---------------------------------------------------------------------------
// Payment report (stock.md §27 — Payment Report)
// ---------------------------------------------------------------------------

export interface PaymentReportRow {
  id: string;
  rentNo: string;
  stockOutDate: Date;
  personName: string;
  personPhone: string;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
}

export interface PaymentReportTotals {
  stockOuts: number;
  amount: number;
  paid: number;
  balance: number;
}

/**
 * Reported per stock out, matching the doc's column list (Person, Stock Out, Total, Paid, Balance,
 * Status) — a receipt-level listing could not carry a total or a balance. The Payment Mode filter
 * therefore reads as "transactions that received a payment by this mode".
 */
export async function paymentReport(
  companyId: string,
  query: PaymentReportQuerySchema,
): Promise<ReportEnvelope<PaymentReportRow, PaymentReportTotals>> {
  const records = await stockOutsRepository.findStockOutsFiltered(
    {
      companyId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      rentalPersonId: query.rentalPersonId,
      paymentMode: query.paymentMode,
      paymentStatus: query.paymentStatus,
      search: query.search,
    },
    REPORT_ROW_LIMIT + 1,
  );

  const truncated = records.length > REPORT_ROW_LIMIT;
  const page = truncated ? records.slice(0, REPORT_ROW_LIMIT) : records;

  const rows: PaymentReportRow[] = page.map((record) => {
    const summary = mapStockOutSummary(record);
    return {
      id: summary.id,
      rentNo: summary.rentNo,
      stockOutDate: summary.stockOutDate,
      personName: summary.rentalPerson.name,
      personPhone: summary.rentalPerson.phone,
      grandTotal: summary.grandTotal,
      paidAmount: summary.paidAmount,
      balanceAmount: summary.balanceAmount,
      paymentStatus: summary.paymentStatus,
    };
  });

  return {
    rows,
    totals: {
      stockOuts: rows.length,
      amount: roundCurrency(rows.reduce((sum, row) => sum + row.grandTotal, 0)),
      paid: roundCurrency(rows.reduce((sum, row) => sum + row.paidAmount, 0)),
      balance: roundCurrency(rows.reduce((sum, row) => sum + row.balanceAmount, 0)),
    },
    truncated,
    rowLimit: REPORT_ROW_LIMIT,
  };
}

// ---------------------------------------------------------------------------
// Person-wise report (stock.md §24, §27 — Person-wise Report)
// ---------------------------------------------------------------------------

export interface PersonSummaryReportRow {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  status: string;
  stockOutCount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  returnedCount: number;
  pendingReturnCount: number;
}

export interface PersonSummaryReportTotals {
  persons: number;
  stockOuts: number;
  amount: number;
  paid: number;
  pending: number;
}

export async function personSummaryReport(
  companyId: string,
  query: PersonSummaryReportQuerySchema,
): Promise<ReportEnvelope<PersonSummaryReportRow, PersonSummaryReportTotals>> {
  const persons = await rentReportsRepository.listPersonsForSummary(
    companyId,
    query.search,
    REPORT_ROW_LIMIT + 1,
  );

  const truncated = persons.length > REPORT_ROW_LIMIT;
  const page = truncated ? persons.slice(0, REPORT_ROW_LIMIT) : persons;
  const personIds = page.map((person) => person.id);

  const [totalsRows, returnCountRows] = await Promise.all([
    rentPersonsRepository.sumStockOutTotalsByPerson(companyId, personIds),
    rentPersonsRepository.countStockOutsByPersonAndReturnStatus(companyId, personIds),
  ]);

  const totalsByPerson = new Map(totalsRows.map((row) => [row.rentalPersonId, row]));

  const returnedByPerson = new Map<string, number>();
  const pendingByPerson = new Map<string, number>();
  for (const row of returnCountRows) {
    const target = row.returnStatus === StockReturnStatus.RETURNED ? returnedByPerson : pendingByPerson;
    target.set(row.rentalPersonId, (target.get(row.rentalPersonId) ?? 0) + row.count);
  }

  const rows: PersonSummaryReportRow[] = page.map((person) => {
    const totals = totalsByPerson.get(person.id);
    const totalAmount = totals?.totalAmount ?? 0;
    const paidAmount = totals?.paidAmount ?? 0;

    return {
      id: person.id,
      name: person.name,
      phone: person.phone,
      city: person.city,
      status: person.status,
      stockOutCount: totals?.stockOutCount ?? 0,
      totalAmount,
      paidAmount,
      pendingAmount: roundCurrency(totalAmount - paidAmount),
      returnedCount: returnedByPerson.get(person.id) ?? 0,
      pendingReturnCount: pendingByPerson.get(person.id) ?? 0,
    };
  });

  return {
    rows,
    totals: {
      persons: rows.length,
      stockOuts: rows.reduce((sum, row) => sum + row.stockOutCount, 0),
      amount: roundCurrency(rows.reduce((sum, row) => sum + row.totalAmount, 0)),
      paid: roundCurrency(rows.reduce((sum, row) => sum + row.paidAmount, 0)),
      pending: roundCurrency(rows.reduce((sum, row) => sum + row.pendingAmount, 0)),
    },
    truncated,
    rowLimit: REPORT_ROW_LIMIT,
  };
}
