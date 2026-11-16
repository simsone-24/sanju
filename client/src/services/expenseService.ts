import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type {
  CreateExpenseCategoryInput,
  Expense,
  ExpenseCategory,
  ExpenseInput,
  ListExpenseCategoriesParams,
  ListExpensesParams,
  UpdateExpenseCategoryInput,
} from '../types/expense';
import type { PaginatedResult } from '../types/rent';

// One service for the Expenses module: the expense screens and the category master it depends on
// are used together (the expense form's category dropdown reads the master).

function toFormData(input: ExpenseInput, receipts: File[], removeReceiptIds: number[] = []): FormData {
  const formData = new FormData();
  formData.append('categoryName', input.categoryName);
  formData.append('expenseDate', input.expenseDate);
  formData.append('amount', String(input.amount));
  formData.append('paymentMethod', input.paymentMethod);
  // Always sent, even when empty: on an edit an empty value is how a field is cleared.
  formData.append('paidTo', input.paidTo);
  formData.append('description', input.description);
  receipts.forEach((receipt) => formData.append('receipts', receipt));
  removeReceiptIds.forEach((id) => formData.append('removeReceiptIds', String(id)));
  return formData;
}

// ---- Expenses -------------------------------------------------------------

export async function listExpenses(params: ListExpensesParams): Promise<PaginatedResult<Expense>> {
  const response = await apiClient.get<ApiSuccessResponse<Expense[]>>('/expenses', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

export async function getExpense(id: number): Promise<Expense> {
  const response = await apiClient.get<ApiSuccessResponse<Expense>>(`/expenses/${id}`);
  return response.data.data;
}

export async function createExpense(input: ExpenseInput, receipts: File[]): Promise<Expense> {
  const response = await apiClient.post<ApiSuccessResponse<Expense>>('/expenses', toFormData(input, receipts));
  return response.data.data;
}

export async function updateExpense(
  id: number,
  input: ExpenseInput,
  receipts: File[],
  removeReceiptIds: number[],
): Promise<Expense> {
  const response = await apiClient.put<ApiSuccessResponse<Expense>>(
    `/expenses/${id}`,
    toFormData(input, receipts, removeReceiptIds),
  );
  return response.data.data;
}

export async function deleteExpense(id: number): Promise<void> {
  await apiClient.delete(`/expenses/${id}`);
}

export async function fetchReceiptBlob(expenseId: number, receiptId: number): Promise<Blob> {
  const response = await apiClient.get<Blob>(`/expenses/${expenseId}/receipts/${receiptId}`, { responseType: 'blob' });
  return response.data;
}

export async function downloadReceipt(expenseId: number, receiptId: number, fileName: string): Promise<void> {
  const blob = await fetchReceiptBlob(expenseId, receiptId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

// ---- Expense categories ---------------------------------------------------

export async function listCategories(params: ListExpenseCategoriesParams): Promise<PaginatedResult<ExpenseCategory>> {
  const response = await apiClient.get<ApiSuccessResponse<ExpenseCategory[]>>('/expense-categories', { params });
  return { records: response.data.data, meta: response.data.meta! };
}

export async function createCategory(input: CreateExpenseCategoryInput): Promise<ExpenseCategory> {
  const response = await apiClient.post<ApiSuccessResponse<ExpenseCategory>>('/expense-categories', input);
  return response.data.data;
}

export async function updateCategory(id: number, input: UpdateExpenseCategoryInput): Promise<ExpenseCategory> {
  const response = await apiClient.put<ApiSuccessResponse<ExpenseCategory>>(`/expense-categories/${id}`, input);
  return response.data.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/expense-categories/${id}`);
}
