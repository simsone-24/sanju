import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { SearchBar } from '../../../components/SearchBar';
import { StatusBadge } from '../../../components/StatusBadge';
import { usePermission } from '../../../hooks/usePermission';
import * as userService from '../../../services/userService';
import type { ApiErrorResponse } from '../../../types/api';
import type { CreateUserInput, UpdateUserInput, UserListItem } from '../../../types/user';
import type { CreateUserFormValues, UpdateUserFormValues } from '../../../validation/userSchemas';
import { UserFormDialog, type UserFormSubmitValues } from '../UserFormDialog';

type DialogMode = 'create' | 'edit' | 'view';

/** Empty optional inputs are dropped rather than sent as "", which the API treats as "clear this". */
function optional(value: string | undefined): string | undefined {
  return value?.trim() ? value.trim() : undefined;
}

export default function UsersTab() {
  const queryClient = useQueryClient();
  const canView = usePermission('MASTERS', 'canView');
  const canCreate = usePermission('MASTERS', 'canCreate');
  const canEdit = usePermission('MASTERS', 'canEdit');
  const canDelete = usePermission('MASTERS', 'canDelete');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<DialogMode | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, limit, search }],
    queryFn: () => userService.list({ page, limit, search: search || undefined }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  // Overrides only come with the full record, so the dialog loads the user it is opened on.
  const { data: activeUser } = useQuery({
    queryKey: ['user', activeUserId],
    queryFn: () => userService.getById(activeUserId!),
    enabled: Boolean(activeUserId),
  });

  function invalidateUsers() {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['user-options'] });
  }

  function closeDialog() {
    setMode(null);
    setActiveUserId(null);
    setFormError(null);
  }

  const saveMutation = useMutation({
    mutationFn: async ({ values, permissionOverrides, photo }: UserFormSubmitValues) => {
      const shared = {
        employeeCode: optional(values.employeeCode),
        fullName: values.fullName,
        username: values.username,
        mobile: values.mobile,
        email: optional(values.email),
        city: optional(values.city),
        userGroupId: values.userGroupId,
        isActive: values.isActive,
        permissionOverrides,
      };

      const saved = activeUserId
        ? await userService.update(activeUserId, {
            ...shared,
            // Blank means "keep the current password"; the pair is only sent when it is being changed.
            ...(values.password
              ? { password: values.password, confirmPassword: (values as UpdateUserFormValues).confirmPassword }
              : {}),
          } satisfies UpdateUserInput)
        : await userService.create({
            ...shared,
            password: (values as CreateUserFormValues).password,
            confirmPassword: (values as CreateUserFormValues).confirmPassword,
          } satisfies CreateUserInput);

      // Uploaded after the record exists, so a new user's photo has an id to attach to.
      return photo ? userService.uploadProfilePhoto(saved.id, photo) : saved;
    },
    onSuccess: (saved) => {
      invalidateUsers();
      queryClient.invalidateQueries({ queryKey: ['user', saved.id] });
      closeDialog();
    },
  });

  async function handleSave(submission: UserFormSubmitValues) {
    setFormError(null);
    try {
      await saveMutation.mutateAsync(submission);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Unable to save the user. Please try again.');
      }
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.remove(id),
    onSuccess: () => {
      invalidateUsers();
      setDeletingUser(null);
    },
  });

  const columns: DataTableColumn<UserListItem>[] = [
    { key: 'fullName', header: 'Full Name', sortable: true },
    { key: 'username', header: 'Username', sortable: true },
    {
      key: 'userGroup',
      header: 'User Group',
      render: (row) => row.userGroup.groupName,
      exportValue: (row) => row.userGroup.groupName,
    },
    { key: 'mobile', header: 'Mobile Number', render: (row) => row.mobile || '—' },
    { key: 'email', header: 'Email', render: (row) => row.email ?? '—', exportValue: (row) => row.email ?? '' },
    { key: 'city', header: 'City', render: (row) => row.city ?? '—', exportValue: (row) => row.city ?? '' },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => <StatusBadge type="active" status={row.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />,
      exportValue: (row) => (row.isActive ? 'ACTIVE' : 'INACTIVE'),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={() => {
                setActiveUserId(row.id);
                setMode('view');
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canEdit && (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  setActiveUserId(row.id);
                  setMode('edit');
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => setDeletingUser(row)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view users.</Typography>;
  }

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <SearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by name, username, mobile, email..."
        />
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setActiveUserId(null);
              setFormError(null);
              setMode('create');
            }}
          >
            Add User
          </Button>
        )}
      </Stack>

      <DataTable
        columns={columns}
        rows={data?.records ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        meta={data?.meta}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        emptyMessage="No users found."
        exportFileName="users"
      />

      <UserFormDialog
        // Remounted per user so the form always initialises from the record it is editing.
        key={activeUserId ?? 'new'}
        open={mode !== null && (mode === 'create' || Boolean(activeUser))}
        user={mode === 'create' ? undefined : activeUser}
        readOnly={mode === 'view'}
        saving={saveMutation.isPending}
        error={formError}
        onSave={handleSave}
        onClose={closeDialog}
      />

      <ConfirmDialog
        open={Boolean(deletingUser)}
        title="Delete User?"
        message={`Delete "${deletingUser?.fullName}"? This user will no longer be able to sign in.`}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
        onClose={() => setDeletingUser(null)}
      />
    </>
  );
}
