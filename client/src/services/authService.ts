import { apiClient } from '../api/client';
import type { ApiSuccessResponse } from '../types/api';
import type { AuthenticatedProfile, LoginResponse } from '../types/auth';

export interface LoginPayload {
  username: string;
  password: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<ApiSuccessResponse<LoginResponse>>('/auth/login', payload);
  return response.data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function fetchCurrentUser(): Promise<AuthenticatedProfile> {
  const response = await apiClient.get<ApiSuccessResponse<AuthenticatedProfile>>('/auth/me');
  return response.data.data;
}
