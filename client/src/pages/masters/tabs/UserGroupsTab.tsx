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
import * as userGroupService from '../../../services/userGroupService';
import type { ApiErrorResponse } from '../../../types/api';
import type { SaveUserGroupInput, UserGroupListItem } from '../../../types/userGroup';
import { UserGroupFormDialog } from '../UserGroupFormDialog';

type DialogMode = 'create' | 'edit' | 'view';

export default function UserGroupsTab() {
  const queryClient = useQueryClient();
  const canView = usePermission('MASTERS', 'canView');
  const canCreate = usePermission('MASTERS', 'canCreate');
  const canEdit = usePermission('MASTERS', 'canEdit');
  const canDelete = usePermission('MASTERS', 'canDelete');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<DialogMode | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<UserGroupListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['user-groups', { page, limit, search }],
    queryFn: () => userGroupService.list({ page, limit, search: search || undefined }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  // The list rows carry no permissions — the dialog needs the full record, so it is fetched when a
  // group is opened.
  const { data: activeGroup } = useQuery({
    queryKey: ['user-group', activeGroupId],
    queryFn: () => userGroupService.getById(activeGroupId!),
    enabled: Boolean(activeGroupId),
  });

  function invalidateGroups() {
    queryClient.invalidateQueries({ queryKey: ['user-groups'] });
    queryClient.invalidateQueries({ queryKey: ['user-group-options'] });
  }

  function closeDialog() {
    setMode(null);
    setActiveGroupId(null);
    setFormError(null);
  }

  const saveMutation = useMutation({
    mutationFn: (input: SaveUserGroupInput) =>
      activeGroupId ? userGroupService.update(activeGroupId, input) : userGroupService.create(input),
    onSuccess: (saved) => {
      invalidateGroups();
      queryClient.invalidateQueries({ queryKey: ['user-group', saved.id] });
      closeDialog();
    },
  });

  async function handleSave(input: SaveUserGroupInput) {
    setFormError(null);
    try {
      await saveMutation.mutateAsync(input);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Unable to save the user group. Please try again.');
      }
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userGroupService.remove(id),
    onSuccess: () => {
      invalidateGroups();
      setDeletingGroup(null);
    },
  });

  async function handleDelete() {
    if (!deletingGroup) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deletingGroup.id);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setDeleteError(error.response.data.message);
      } else {
        setDeleteError('Unable to delete the user group. Please try again.');
      }
    }
  }

  const columns: DataTableColumn<UserGroupListItem>[] = [
    { key: 'groupName', header: 'Group Name', sortable: true, align: 'center' },
    {
      key: 'description',
      header: 'Description',
      align: 'center',
      render: (row) => row.description ?? '—',
      exportValue: (row) => row.description ?? '',
    },
    {
      key: 'users',
      header: 'Total Users',
      align: 'center',
      sortable: true,
      render: (row) => row._count.users,
      exportValue: (row) => String(row._count.users),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge type="active" status={row.status} size="sm" />,
      exportValue: (row) => row.status,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          <Tooltip title="View">
            <IconButton
              size="small"
              onClick={() => {
                setActiveGroupId(row.id);
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
                  setActiveGroupId(row.id);
                  setMode('edit');
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setDeleteError(null);
                  setDeletingGroup(row);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view user groups.</Typography>;
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
          placeholder="Search by group name..."
        />
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setActiveGroupId(null);
              setFormError(null);
              setMode('create');
            }}
          >
            Add User Group
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
        emptyMessage="No user groups found."
        exportFileName="user-groups"
      />

      <UserGroupFormDialog
        // Remounted per group so the form always initialises from the record it is editing.
        key={activeGroupId ?? 'new'}
        open={mode !== null && (mode === 'create' || Boolean(activeGroup))}
        userGroup={mode === 'create' ? undefined : activeGroup}
        readOnly={mode === 'view'}
        saving={saveMutation.isPending}
        error={formError}
        onSave={handleSave}
        onClose={closeDialog}
      />

      <ConfirmDialog
        open={Boolean(deletingGroup)}
        title="Delete User Group?"
        message={
          deleteError ??
          `Delete "${deletingGroup?.groupName}"? This is only possible while no users are assigned to it.`
        }
        danger
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeletingGroup(null)}
      />
    </>
  );
}
