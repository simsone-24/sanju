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

export interface UpdateProfilePayload {
  fullName: string;
  mobile: string;
  /** Empty string clears the value. */
  email: string;
  city: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthenticatedProfile> {
  const response = await apiClient.put<ApiSuccessResponse<AuthenticatedProfile>>('/auth/profile', payload);
  return response.data.data;
}

export async function uploadProfilePhoto(file: File): Promise<AuthenticatedProfile> {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await apiClient.post<ApiSuccessResponse<AuthenticatedProfile>>('/auth/profile/photo', formData);
  return response.data.data;
}

// The photo route is authenticated, so it can't be a plain <img src>; the caller revokes the URL.
export async function getProfilePhotoObjectUrl(): Promise<string> {
  const response = await apiClient.get('/auth/profile/photo', { responseType: 'blob' });
  return URL.createObjectURL(response.data as Blob);
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.put('/auth/password', payload);
}
