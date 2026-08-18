import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type {
  CreateRentPaymentInput,
  CreateRentalItemInput,
  CreateRentalPersonInput,
  CreateStockOutInput,
  CreateStockReturnInput,
  ListRentPaymentsParams,
  ListRentalItemsParams,
  ListRentalPersonsParams,
  ListStockOutsParams,
  ListStockReturnsParams,
  PaginatedResult,
  PaymentReport,
  PendingReturnReport,
  PersonSummaryReport,
  RentDashboard,
  RentPayment,
  RentPaymentSummary,
  RentReportFilters,
  RentalItem,
  RentalPerson,
  ReturnReport,
  ReturnSummary,
  StockOutDetail,
  StockOutReport,
  StockOutSummary,
  StockReturn,
  UpdateRentPaymentInput,
  UpdateRentalItemInput,
  UpdateRentalPersonInput,
  UpdateStockOutInput,
} from '../types/rent';

// One service file for the whole Rent module: its screens read across each other constantly (a
// stock out page books returns and payments, the payment dialog reads stock outs), so splitting the
// calls into six files would only scatter one feature's API surface.

async function getPaginated<T>(url: string, params: object): Promise<PaginatedResult<T>> {
  const response = await apiClient.get<ApiSuccessResponse<T[]>>(url, { params });
  return { records: response.data.data, meta: response.data.meta! };
}

async function get<T>(url: string, params?: object): Promise<T> {
  const response = await apiClient.get<ApiSuccessResponse<T>>(url, params ? { params } : undefined);
  return response.data.data;
}

// ---- Rental persons -------------------------------------------------------

export function listPersons(params: ListRentalPersonsParams): Promise<PaginatedResult<RentalPerson>> {
  return getPaginated<RentalPerson>('/rent/persons', params);
}

export function getPerson(id: number): Promise<RentalPerson> {
  return get<RentalPerson>(`/rent/persons/${id}`);
}

export async function createPerson(input: CreateRentalPersonInput): Promise<RentalPerson> {
  const response = await apiClient.post<ApiSuccessResponse<RentalPerson>>('/rent/persons', input);
  return response.data.data;
}

export async function updatePerson(id: number, input: UpdateRentalPersonInput): Promise<RentalPerson> {
  const response = await apiClient.put<ApiSuccessResponse<RentalPerson>>(`/rent/persons/${id}`, input);
  return response.data.data;
}

export async function deletePerson(id: number): Promise<void> {
  await apiClient.delete(`/rent/persons/${id}`);
}

// ---- Rental items ---------------------------------------------------------

export function listItems(params: ListRentalItemsParams): Promise<PaginatedResult<RentalItem>> {
  return getPaginated<RentalItem>('/rent/items', params);
}

export function listItemCategories(): Promise<string[]> {
  return get<string[]>('/rent/items/categories');
}

export async function createItem(input: CreateRentalItemInput): Promise<RentalItem> {
  const response = await apiClient.post<ApiSuccessResponse<RentalItem>>('/rent/items', input);
  return response.data.data;
}

export async function updateItem(id: number, input: UpdateRentalItemInput): Promise<RentalItem> {
  const response = await apiClient.put<ApiSuccessResponse<RentalItem>>(`/rent/items/${id}`, input);
  return response.data.data;
}

export async function deleteItem(id: number): Promise<void> {
  await apiClient.delete(`/rent/items/${id}`);
}

// ---- Stock out ------------------------------------------------------------

export function listStockOuts(params: ListStockOutsParams): Promise<PaginatedResult<StockOutSummary>> {
  return getPaginated<StockOutSummary>('/rent/stock-outs', params);
}

export function getStockOut(id: number): Promise<StockOutDetail> {
  return get<StockOutDetail>(`/rent/stock-outs/${id}`);
}

export async function createStockOut(input: CreateStockOutInput): Promise<StockOutDetail> {
  const response = await apiClient.post<ApiSuccessResponse<StockOutDetail>>('/rent/stock-outs', input);
  return response.data.data;
}

export async function updateStockOut(id: number, input: UpdateStockOutInput): Promise<StockOutDetail> {
  const response = await apiClient.put<ApiSuccessResponse<StockOutDetail>>(`/rent/stock-outs/${id}`, input);
  return response.data.data;
}

export async function cancelStockOut(id: number, reason?: string): Promise<StockOutDetail> {
  const response = await apiClient.patch<ApiSuccessResponse<StockOutDetail>>(`/rent/stock-outs/${id}/cancel`, {
    reason,
  });
  return response.data.data;
}

export async function deleteStockOut(id: number): Promise<void> {
  await apiClient.delete(`/rent/stock-outs/${id}`);
}

// ---- Stock return ---------------------------------------------------------

export function listReturns(params: ListStockReturnsParams): Promise<PaginatedResult<StockReturn>> {
  return getPaginated<StockReturn>('/rent/returns', params);
}

export function getReturn(id: number): Promise<StockReturn> {
  return get<StockReturn>(`/rent/returns/${id}`);
}

export function getReturnSummary(): Promise<ReturnSummary> {
  return get<ReturnSummary>('/rent/returns/summary');
}

export async function createReturn(stockOutId: number, input: CreateStockReturnInput): Promise<StockReturn> {
  const response = await apiClient.post<ApiSuccessResponse<StockReturn>>(
    `/rent/stock-outs/${stockOutId}/returns`,
    input,
  );
  return response.data.data;
}

// ---- Rent payments --------------------------------------------------------

export function listPayments(params: ListRentPaymentsParams): Promise<PaginatedResult<RentPayment>> {
  return getPaginated<RentPayment>('/rent/payments', params);
}

export function getPaymentSummary(): Promise<RentPaymentSummary> {
  return get<RentPaymentSummary>('/rent/payments/summary');
}

export async function createPayment(input: CreateRentPaymentInput): Promise<RentPayment> {
  const response = await apiClient.post<ApiSuccessResponse<RentPayment>>('/rent/payments', input);
  return response.data.data;
}

export async function updatePayment(id: number, input: UpdateRentPaymentInput): Promise<RentPayment> {
  const response = await apiClient.put<ApiSuccessResponse<RentPayment>>(`/rent/payments/${id}`, input);
  return response.data.data;
}

export async function deletePayment(id: number): Promise<void> {
  await apiClient.delete(`/rent/payments/${id}`);
}

// ---- Dashboard + reports --------------------------------------------------

export function getDashboard(): Promise<RentDashboard> {
  return get<RentDashboard>('/rent/dashboard');
}

export function getStockOutReport(filters: RentReportFilters): Promise<StockOutReport> {
  return get<StockOutReport>('/rent/reports/stock-out', filters);
}

export function getReturnReport(filters: RentReportFilters): Promise<ReturnReport> {
  return get<ReturnReport>('/rent/reports/returns', filters);
}

export function getPendingReturnReport(filters: RentReportFilters): Promise<PendingReturnReport> {
  return get<PendingReturnReport>('/rent/reports/pending-returns', filters);
}

export function getPaymentReport(filters: RentReportFilters): Promise<PaymentReport> {
  return get<PaymentReport>('/rent/reports/payments', filters);
}

export function getPersonSummaryReport(filters: RentReportFilters): Promise<PersonSummaryReport> {
  return get<PersonSummaryReport>('/rent/reports/person-summary', filters);
}
