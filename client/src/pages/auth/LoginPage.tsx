import { useState, type KeyboardEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import KeyboardCapslockIcon from '@mui/icons-material/KeyboardCapslock';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { useLogin } from '../../hooks/useAuth';
import type { ApiErrorResponse } from '../../types/api';
import { loginSchema, type LoginFormValues } from '../../validation/authSchemas';

// Browsers paint an autofilled input with their own background, which covers the text but not the
// icon beside it, so the field reads as two boxes. An inset shadow in the card's colour hides that
// tint and keeps the field one surface in either colour scheme.
const AUTOFILL_SX = {
  '& input:-webkit-autofill': {
    WebkitBoxShadow: '0 0 0 100px var(--mui-palette-background-paper) inset',
    WebkitTextFillColor: 'var(--mui-palette-text-primary)',
    caretColor: 'var(--mui-palette-text-primary)',
  },
} as const;

export default function LoginPage() {
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  // md files/forms.md §Validation: a field is checked once it has been left, then on every keystroke,
  // so an error appears as soon as it is real and clears the moment it is fixed.
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { username: '', password: '' },
  });

  const submitting = isSubmitting || loginMutation.isPending;

  // A rejected sign-in describes the attempt that was made, so it is cleared as soon as either field
  // changes rather than left sitting over the new input.
  const clearServerError = () => setServerError(null);

  // Caps Lock can only be read from a key event, so it is checked on every key in the password field
  // and forgotten when the field loses focus.
  function trackCapsLock(event: KeyboardEvent<HTMLElement>) {
    setCapsLockOn(event.getModifierState('CapsLock'));
  }

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

  // A validation message outranks the Caps Lock hint: it is the reason the form will not submit.
  const passwordHelper =
    errors.password?.message ??
    (capsLockOn ? (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'warning.dark' }}>
        <KeyboardCapslockIcon sx={{ fontSize: 14 }} />
        Caps Lock is on
      </Box>
    ) : undefined);

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Sign in to continue to your account
        </Typography>
      </Box>

      {serverError && (
        <Alert severity="error" onClose={clearServerError} sx={{ mb: 2.5, alignItems: 'center' }}>
          {serverError}
        </Alert>
      )}

      <Stack spacing={2.5}>
        <TextField
          label="Username"
          placeholder="Enter your username"
          required
          fullWidth
          autoComplete="username"
          autoFocus
          error={Boolean(errors.username)}
          helperText={errors.username?.message}
          sx={AUTOFILL_SX}
          {...register('username', { onChange: clearServerError })}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Password"
          placeholder="Enter your password"
          required
          type={showPassword ? 'text' : 'password'}
          fullWidth
          autoComplete="current-password"
          error={Boolean(errors.password)}
          helperText={passwordHelper}
          sx={AUTOFILL_SX}
          {...register('password', { onChange: clearServerError, onBlur: () => setCapsLockOn(false) })}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    size="small"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((visible) => !visible)}
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
            htmlInput: { onKeyDown: trackCapsLock, onKeyUp: trackCapsLock },
          }}
        />
      </Stack>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        loading={submitting}
        loadingPosition="start"
        startIcon={<LoginRoundedIcon />}
        sx={{ mt: 3.5, py: 1.5, fontWeight: 700, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.28)' }}
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </Box>
  );
}
