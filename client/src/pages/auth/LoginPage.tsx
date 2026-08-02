import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { useLogin } from '../../hooks/useAuth';
import type { ApiErrorResponse } from '../../types/api';
import { loginSchema, type LoginFormValues } from '../../validation/authSchemas';

export default function LoginPage() {
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await loginMutation.mutateAsync(values);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setServerError(error.response.data.message);
      } else {
        setServerError('Unable to sign in. Please try again.');
      }
    }
  });

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Typography variant="h1" sx={{ mb: 3 }}>
        Sign in
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}

      <TextField
        label="Username"
        fullWidth
        margin="normal"
        autoComplete="username"
        autoFocus
        error={Boolean(errors.username)}
        helperText={errors.username?.message}
        {...register('username')}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        autoComplete="current-password"
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        {...register('password')}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        sx={{ mt: 3 }}
        disabled={isSubmitting || loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </Box>
  );
}
