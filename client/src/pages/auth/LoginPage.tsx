import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Alert, Box, Button, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { useLogin } from '../../hooks/useAuth';
import type { ApiErrorResponse } from '../../types/api';
import { loginSchema, type LoginFormValues } from '../../validation/authSchemas';

export default function LoginPage() {
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
        type={showPassword ? 'text' : 'password'}
        fullWidth
        margin="normal"
        autoComplete="current-password"
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        {...register('password')}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  onMouseDown={(event) => event.preventDefault()}
                >
                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
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
