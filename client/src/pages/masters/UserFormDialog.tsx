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
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FileUploader } from '../../components/FileUploader';
import * as userGroupService from '../../services/userGroupService';
import * as userService from '../../services/userService';
import type { PermissionGrant } from '../../types/permission';
import type { UserDetail } from '../../types/user';
import { avatarHue, avatarInitials } from '../../utils/avatar';
import { fromId } from '../../utils/ids';
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from '../../validation/userSchemas';
import { PermissionMatrixEditor } from './PermissionMatrixEditor';

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

export interface UserFormSubmitValues {
  values: CreateUserFormValues | UpdateUserFormValues;
  permissionOverrides: PermissionGrant[];
  photo: File | null;
}

interface UserFormDialogProps {
  open: boolean;
  /** Omitted when creating. */
  user?: UserDetail;
  /** Renders the same screen without inputs — the list's "View" action. */
  readOnly?: boolean;
  saving: boolean;
  error: string | null;
  onSave: (submission: UserFormSubmitValues) => void;
  onClose: () => void;
}

const EMPTY_FORM: CreateUserFormValues = {
  fullName: '',
  username: '',
  password: '',
  confirmPassword: '',
  mobile: '',
  email: '',
  city: '',
  userGroupId: '',
  isActive: true,
};

// user.md §Create User plus §User Override Screen: the profile and the user's additional permissions
// are one screen, which keeps the list's actions to the documented View and Edit.
export function UserFormDialog({
  open,
  user,
  readOnly = false,
  saving,
  error,
  onSave,
  onClose,
}: UserFormDialogProps) {
  const isEdit = Boolean(user);
  const [permissionOverrides, setPermissionOverrides] = useState<PermissionGrant[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const { data: groupOptions } = useQuery({
    queryKey: ['user-group-options'],
    queryFn: () => userGroupService.listOptions(),
    enabled: open && !readOnly,
  });

  // The user's group grants are shown ticked-and-locked inside the override editor, so it is clear
  // what the user already has before anything extra is granted.
  const { data: assignedGroup } = useQuery({
    queryKey: ['user-group', user?.userGroup.id],
    queryFn: () => userGroupService.getById(user!.userGroup.id),
    enabled: open && Boolean(user?.userGroup.id),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues | UpdateUserFormValues>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: EMPTY_FORM,
  });

  // The stored photo comes from an authenticated route, so it is loaded as a blob; a newly chosen
  // file previews from its own object URL before it has been uploaded.
  useEffect(() => {
    if (!open) {
      setPhotoPreviewUrl(null);
      return;
    }

    if (photo) {
      const objectUrl = URL.createObjectURL(photo);
      setPhotoPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    if (!user?.profilePhoto) {
      setPhotoPreviewUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    userService
      .getProfilePhotoObjectUrl(user.id)
      .then((url) => {
        objectUrl = url;
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setPhotoPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPhotoPreviewUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, photo, user?.id, user?.profilePhoto]);

  useEffect(() => {
    if (!open) return;
    reset(
      user
        ? {
            fullName: user.fullName,
            username: user.username,
            password: '',
            confirmPassword: '',
            mobile: user.mobile,
            email: user.email ?? '',
            city: user.city ?? '',
            userGroupId: fromId(user.userGroup.id),
            isActive: user.isActive,
          }
        : EMPTY_FORM,
    );
    setPermissionOverrides(user?.permissionOverrides ?? []);
    setPhoto(null);
  }, [open, user, reset]);

  const onSubmit = handleSubmit((values) => {
    onSave({ values, permissionOverrides, photo });
  });

  const title = readOnly ? 'User' : isEdit ? 'Edit User' : 'Add User';
  // The form is resolved against one of two schemas, so `errors` is a union whose members are not
  // index-compatible; the shape of an individual error is identical either way.
  const fieldErrors: Partial<Record<keyof CreateUserFormValues, { message?: string }>> = errors;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{readOnly && user ? `${title} — ${user.fullName}` : title}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Basic Information
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            mb: 3,
          }}
        >
          <TextField
            label="Full Name"
            required
            fullWidth
            disabled={readOnly}
            error={Boolean(fieldErrors.fullName)}
            helperText={fieldErrors.fullName?.message}
            {...register('fullName')}
          />
          <TextField
            label="Username"
            required
            fullWidth
            disabled={readOnly}
            autoComplete="off"
            error={Boolean(fieldErrors.username)}
            helperText={fieldErrors.username?.message ?? 'Used to sign in.'}
            {...register('username')}
          />
          <TextField
            label="Mobile Number"
            required
            fullWidth
            disabled={readOnly}
            error={Boolean(fieldErrors.mobile)}
            helperText={fieldErrors.mobile?.message}
            {...register('mobile')}
          />
          {!readOnly && (
            <>
              <TextField
                label={isEdit ? 'New Password' : 'Password'}
                type="password"
                required={!isEdit}
                fullWidth
                autoComplete="new-password"
                error={Boolean(fieldErrors.password)}
                helperText={
                  fieldErrors.password?.message ??
                  (isEdit ? 'Leave blank to keep the current password.' : undefined)
                }
                {...register('password')}
              />
              <TextField
                label="Confirm Password"
                type="password"
                required={!isEdit}
                fullWidth
                autoComplete="new-password"
                error={Boolean(fieldErrors.confirmPassword)}
                helperText={fieldErrors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </>
          )}
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            disabled={readOnly}
            error={Boolean(fieldErrors.email)}
            helperText={fieldErrors.email?.message}
            {...register('email')}
          />
          <TextField
            label="City"
            fullWidth
            disabled={readOnly}
            error={Boolean(fieldErrors.city)}
            helperText={fieldErrors.city?.message}
            {...register('city')}
          />
          <Controller
            control={control}
            name="userGroupId"
            render={({ field }) => (
              <TextField
                select
                label="User Group"
                required
                fullWidth
                disabled={readOnly}
                error={Boolean(fieldErrors.userGroupId)}
                helperText={fieldErrors.userGroupId?.message}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
              >
                {readOnly && user ? (
                  <MenuItem value={fromId(user.userGroup.id)}>{user.userGroup.groupName}</MenuItem>
                ) : (
                  (groupOptions ?? []).map((group) => (
                    <MenuItem key={group.id} value={fromId(group.id)}>
                      {group.groupName}
                    </MenuItem>
                  ))
                )}
              </TextField>
            )}
          />
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <FormControlLabel
                label="Active"
                control={
                  <Switch
                    checked={Boolean(field.value)}
                    disabled={readOnly}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                }
              />
            )}
          />
        </Box>

        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
          <Avatar
            src={photoPreviewUrl ?? undefined}
            sx={{ width: 56, height: 56, bgcolor: avatarHue(user?.fullName ?? 'user') }}
          >
            {avatarInitials(user?.fullName || 'New User')}
          </Avatar>
          {readOnly ? (
            <Typography variant="body2" color="text.secondary">
              {user?.profilePhoto ? 'A profile photo is on file.' : 'No profile photo.'}
            </Typography>
          ) : (
            <Box sx={{ flexGrow: 1 }}>
              <FileUploader
                label="Profile Photo"
                accept="image/jpeg,image/png,image/webp"
                maxSizeBytes={MAX_PHOTO_SIZE_BYTES}
                file={photo}
                onChange={setPhoto}
              />
              {user?.profilePhoto && !photo && (
                <Typography variant="caption" color="text.secondary">
                  A photo is already on file. Choosing a new one replaces it.
                </Typography>
              )}
            </Box>
          )}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2">Additional Permissions</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          This user inherits everything their group allows. Tick anything extra they need — it applies
          to this user only.
        </Typography>
        <PermissionMatrixEditor
          value={permissionOverrides}
          onChange={setPermissionOverrides}
          inherited={assignedGroup?.permissions ?? []}
          inheritedLabel={user ? user.userGroup.groupName : 'From group'}
          readOnly={readOnly}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && (
          <Button variant="contained" onClick={onSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
