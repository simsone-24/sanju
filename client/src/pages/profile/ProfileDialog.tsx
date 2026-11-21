import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileUploader } from '../../components/FileUploader';
import { useProfilePhotoUrl } from '../../hooks/useProfilePhotoUrl';
import * as authService from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import type { AuthenticatedProfile } from '../../types/auth';
import { describeApiError } from '../../utils/apiError';
import { avatarHue, avatarInitials } from '../../utils/avatar';
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordFormValues,
  type ProfileFormValues,
} from '../../validation/profileSchemas';

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

interface ProfileDialogProps {
  open: boolean;
  user: AuthenticatedProfile;
  onClose: () => void;
}

type ProfileTab = 'details' | 'password';

function toFormValues(user: AuthenticatedProfile): ProfileFormValues {
  return { fullName: user.fullName, mobile: user.mobile, email: user.email ?? '', city: user.city ?? '' };
}

interface DetailsFormProps {
  user: AuthenticatedProfile;
  onClose: () => void;
}

function DetailsForm({ user, onClose }: DetailsFormProps) {
  const setUser = useAuthStore((state) => state.setUser);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const storedPhotoUrl = useProfilePhotoUrl(user.profilePhoto);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(user),
  });

  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  const saveMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const updated = await authService.updateProfile(values);
      // Uploaded second so the text changes are not lost if only the photo is rejected.
      return photo ? authService.uploadProfilePhoto(photo) : updated;
    },
    onSuccess: (updated) => {
      setUser(updated);
      reset(toFormValues(updated));
      setPhoto(null);
      onClose();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await saveMutation.mutateAsync(values);
    } catch (error) {
      setFormError(describeApiError(error, 'Unable to update your profile. Please try again.'));
    }
  });

  return (
    <>
      <DialogContent dividers>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
          <Avatar
            src={photoPreviewUrl ?? storedPhotoUrl ?? undefined}
            sx={{ width: 64, height: 64, bgcolor: avatarHue(user.fullName) }}
          >
            {avatarInitials(user.fullName)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <FileUploader
              label="Profile Photo"
              accept="image/jpeg,image/png,image/webp"
              maxSizeBytes={MAX_PHOTO_SIZE_BYTES}
              file={photo}
              onChange={setPhoto}
            />
          </Box>
        </Stack>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
          <TextField
            label="Full Name"
            required
            fullWidth
            error={Boolean(errors.fullName)}
            helperText={errors.fullName?.message}
            {...register('fullName')}
          />
          <TextField
            label="Username"
            fullWidth
            value={user.username}
            disabled
            helperText="Contact an administrator to change your username."
          />
          <TextField
            label="Mobile Number"
            required
            fullWidth
            error={Boolean(errors.mobile)}
            helperText={errors.mobile?.message}
            {...register('mobile')}
          />
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="City"
            fullWidth
            error={Boolean(errors.city)}
            helperText={errors.city?.message}
            {...register('city')}
          />
          <TextField label="User Group" fullWidth value={user.userGroup.groupName} disabled />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saveMutation.isPending}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </>
  );
}

interface PasswordFormProps {
  onClose: () => void;
}

function PasswordForm({ onClose }: PasswordFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const changeMutation = useMutation({
    mutationFn: (values: ChangePasswordFormValues) => authService.changePassword(values),
    onSuccess: () => {
      reset();
      setSaved(true);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSaved(false);
    try {
      await changeMutation.mutateAsync(values);
    } catch (error) {
      setFormError(describeApiError(error, 'Unable to change your password. Please try again.'));
    }
  });

  return (
    <>
      <DialogContent dividers>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your password has been changed.
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            label="Current Password"
            type="password"
            required
            fullWidth
            autoComplete="current-password"
            error={Boolean(errors.currentPassword)}
            helperText={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <TextField
            label="New Password"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            error={Boolean(errors.newPassword)}
            helperText={errors.newPassword?.message ?? 'At least 8 characters.'}
            {...register('newPassword')}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={changeMutation.isPending}>
          Close
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={changeMutation.isPending}>
          {changeMutation.isPending ? 'Saving…' : 'Change Password'}
        </Button>
      </DialogActions>
    </>
  );
}

// Self-service profile: a person's own contact details, photo and password. Group, username and
// permissions are deliberately absent — those stay with administrators in Masters → Users.
export function ProfileDialog({ open, user, onClose }: ProfileDialogProps) {
  const [tab, setTab] = useState<ProfileTab>('details');

  useEffect(() => {
    if (open) setTab('details');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Typography variant="h6" component="span">
          My Profile
        </Typography>
        <Tabs value={tab} onChange={(_event, value: ProfileTab) => setTab(value)} sx={{ mt: 1 }}>
          <Tab label="Details" value="details" />
          <Tab label="Change Password" value="password" />
        </Tabs>
      </DialogTitle>
      {tab === 'details' ? <DetailsForm user={user} onClose={onClose} /> : <PasswordForm onClose={onClose} />}
    </Dialog>
  );
}
