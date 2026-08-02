import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import type { LoginPayload } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(user);
  return { user, isAuthenticated };
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
      navigate('/', { replace: true });
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      clearSession();
      navigate('/login', { replace: true });
    },
  });
}
