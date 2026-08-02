import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ApiErrorResponse, ApiSuccessResponse } from '../types/api';
import type { AuthTokens } from '../types/auth';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<AuthTokens> | null = null;

async function refreshTokens(): Promise<AuthTokens> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error('No refresh token available.');

  const response = await axios.post<ApiSuccessResponse<AuthTokens>>(
    `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
    { refreshToken },
  );
  return response.data.data;
}

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        refreshPromise ??= refreshTokens();
        const tokens = await refreshPromise;
        refreshPromise = null;
        useAuthStore.getState().setTokens(tokens);
        originalRequest.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
        return apiClient(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        useAuthStore.getState().clearSession();
        window.location.assign('/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
