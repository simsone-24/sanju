import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { PermissionGrant } from '../../types/permission';
import type { SaveUserGroupInput, UserGroupDetail } from '../../types/userGroup';
import { userGroupFormSchema, type UserGroupFormValues } from '../../validation/userGroupSchemas';
import { PermissionMatrixEditor } from './PermissionMatrixEditor';

interface UserGroupFormDialogProps {
  open: boolean;
  /** Omitted when creating. */
  userGroup?: UserGroupDetail;
  /** Renders the same screen without inputs — the list's "View" action. */
  readOnly?: boolean;
  saving: boolean;
  error: string | null;
  onSave: (input: SaveUserGroupInput) => void;
  onClose: () => void;
}

const EMPTY_FORM: UserGroupFormValues = { groupName: '', description: '', status: 'ACTIVE' };

// user.md §Create User Group presents Basic Information and Module Permissions as one screen, so
// both are saved together — a group is never left half-configured by a two-step flow.
export function UserGroupFormDialog({
  open,
  userGroup,
  readOnly = false,
  saving,
  error,
  onSave,
  onClose,
}: UserGroupFormDialogProps) {
  const [permissions, setPermissions] = useState<PermissionGrant[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserGroupFormValues>({ resolver: zodResolver(userGroupFormSchema), defaultValues: EMPTY_FORM });

  useEffect(() => {
    if (!open) return;
    reset(
      userGroup
        ? {
            groupName: userGroup.groupName,
            description: userGroup.description ?? '',
            status: userGroup.status,
          }
        : EMPTY_FORM,
    );
    setPermissions(userGroup?.permissions ?? []);
  }, [open, userGroup, reset]);

  const onSubmit = handleSubmit((values) => {
    onSave({
      groupName: values.groupName,
      description: values.description || undefined,
      status: values.status,
      permissions,
    });
  });

  const title = readOnly ? 'User Group' : userGroup ? 'Edit User Group' : 'Add User Group';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{readOnly && userGroup ? `${title} — ${userGroup.groupName}` : title}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Basic Information
        </Typography>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Group Name"
            required
            fullWidth
            disabled={readOnly}
            error={Boolean(errors.groupName)}
            helperText={errors.groupName?.message}
            {...register('groupName')}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            disabled={readOnly}
            error={Boolean(errors.description)}
            helperText={errors.description?.message}
            {...register('description')}
          />
          <TextField select label="Status" required fullWidth disabled={readOnly} {...register('status')}>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </TextField>
          {userGroup && (
            <Typography variant="caption" color="text.secondary">
              {userGroup._count.users} user(s) assigned. Permission changes apply to all of them
              immediately.
            </Typography>
          )}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Module Permissions
        </Typography>
        <PermissionMatrixEditor value={permissions} onChange={setPermissions} readOnly={readOnly} />
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
