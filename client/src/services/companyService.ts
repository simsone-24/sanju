import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type { CompanyDetail, UpdateCompanyInput } from '../types/company';

export async function getCompany(): Promise<CompanyDetail> {
  const response = await apiClient.get<ApiSuccessResponse<CompanyDetail>>('/settings/company');
  return response.data.data;
}

export async function updateCompany(input: UpdateCompanyInput): Promise<CompanyDetail> {
  const response = await apiClient.put<ApiSuccessResponse<CompanyDetail>>('/settings/company', input);
  return response.data.data;
}

export async function uploadLogo(file: File): Promise<CompanyDetail> {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await apiClient.post<ApiSuccessResponse<CompanyDetail>>('/settings/company/logo', formData);
  return response.data.data;
}
