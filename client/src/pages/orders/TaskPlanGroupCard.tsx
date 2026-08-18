import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PhotoIcon from '@mui/icons-material/Photo';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FormDrawer } from '../../components/FormDrawer';
import { StatusBadge } from '../../components/StatusBadge';
import * as taskPlanService from '../../services/taskPlanService';
import { useToast } from '../../store/ToastContext';
import type { TaskGroupDetail, TaskGroupStatus, TaskItemDetail, TaskItemStatus } from '../../types/taskPlan';
import { describeApiError } from '../../utils/apiError';
import { formatDate } from '../../utils/format';
import { taskItemSchema, type TaskItemFormValues } from '../../validation/taskPlanSchemas';
import { applyItemStatus } from './taskPlanCache';

const TASK_ITEM_STATUSES: TaskItemStatus[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

interface TaskPlanGroupCardProps {
  group: TaskGroupDetail;
  /** The group's tasks after the tab's search / status filters — never the progress source. */
  visibleItems: TaskItemDetail[];
  /** True while a search or status filter is narrowing the list, which hides the add-task row. */
  filtersActive: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  taskPlanQueryKey: readonly unknown[];
  onEditGroup: (group: TaskGroupDetail) => void;
  onDeleteGroup: (group: TaskGroupDetail) => void;
  onOpenPhoto: (item: TaskItemDetail) => void;
}

function itemSubtitle(item: TaskItemDetail): string {
  const parts: string[] = [];
  if (item.status === 'COMPLETED' && item.completedAt) parts.push(`Completed ${formatDate(item.completedAt)}`);
  if (item.remarks) parts.push(item.remarks);
  return parts.join(' • ');
}

/**
 * One expandable/collapsible Task Group card (scope.md §UI Recommendations) with its task rows,
 * the group's dynamic progress, and every create/edit/delete action for tasks inside it.
 *
 * Ticking is the primary interaction, so it applies to the cached plan immediately and is rolled
 * back only if the server refuses; the row's badge doubles as the control for the third status
 * (In Progress), which would otherwise be reachable only through the edit drawer.
 */
export function TaskPlanGroupCard({
  group,
  visibleItems,
  filtersActive,
  expanded,
  onToggleExpanded,
  canCreate,
  canEdit,
  canDelete,
  taskPlanQueryKey,
  onEditGroup,
  onDeleteGroup,
  onOpenPhoto,
}: TaskPlanGroupCardProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [adding, setAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [editingItem, setEditingItem] = useState<TaskItemDetail | null>(null);
  const [deletingItem, setDeletingItem] = useState<TaskItemDetail | null>(null);
  const [statusMenu, setStatusMenu] = useState<{ anchor: HTMLElement; item: TaskItemDetail } | null>(null);
  const [actionMenu, setActionMenu] = useState<{ anchor: HTMLElement; item: TaskItemDetail } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const newTaskRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<TaskItemFormValues>({
    resolver: zodResolver(taskItemSchema),
    defaultValues: { taskName: '', status: 'PENDING', remarks: '' },
  });

  useEffect(() => {
    if (editingItem) {
      form.reset({
        taskName: editingItem.taskName,
        status: editingItem.status,
        remarks: editingItem.remarks ?? '',
      });
    }
  }, [editingItem, form]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: taskPlanQueryKey });
  }

  const createMutation = useMutation({
    mutationFn: (taskName: string) => taskPlanService.createItem(group.id, { taskName }),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: number; values: TaskItemFormValues }) =>
      taskPlanService.updateItem(input.id, {
        taskName: input.values.taskName,
        status: input.values.status,
        remarks: input.values.remarks || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setEditingItem(null);
      showToast('Task updated.');
    },
  });

  // Optimistic: the checkbox, the row's badge and the group's progress all move on click, and the
  // refetch that follows only confirms them. A failure puts the previous plan straight back.
  const statusMutation = useMutation({
    mutationFn: (input: { id: number; status: TaskItemStatus }) =>
      taskPlanService.updateItem(input.id, { status: input.status }),
    onMutate: async (input) => {
      // An in-flight refetch would otherwise land on top of the optimistic value.
      await queryClient.cancelQueries({ queryKey: taskPlanQueryKey });
      const previous = queryClient.getQueryData<TaskGroupDetail[]>(taskPlanQueryKey);
      queryClient.setQueryData<TaskGroupDetail[]>(taskPlanQueryKey, (current) =>
        applyItemStatus(current, input.id, input.status),
      );
      return { previous };
    },
    onError: (caught, _input, context) => {
      if (context?.previous) queryClient.setQueryData(taskPlanQueryKey, context.previous);
      showToast(describeApiError(caught, 'Unable to update the task status.'), 'error');
    },
    onSettled: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskPlanService.deleteItem(id),
    onSuccess: () => {
      invalidate();
      setDeletingItem(null);
      showToast('Task deleted.');
    },
  });

  const statusChangeMutation = useMutation({
    mutationFn: (status: TaskGroupStatus) => taskPlanService.changeGroupStatus(group.id, status),
    onSuccess: (_data, status) => {
      invalidate();
      showToast(
        status === 'PUBLISHED'
          ? `"${group.title}" published — the team can start ticking it off.`
          : `"${group.title}" moved back to draft.`,
      );
    },
  });

  async function changeGroupStatus(status: TaskGroupStatus) {
    try {
      await statusChangeMutation.mutateAsync(status);
    } catch (caught) {
      showToast(describeApiError(caught, 'Unable to update the task group status.'), 'error');
    }
  }

  // Adding is a single inline field rather than a drawer: a task only needs a name, and typing
  // one then pressing Enter keeps the field open and focused for the next one, so a checklist can
  // be entered in one flow. Status, remarks and photos are set afterwards from the row itself.
  async function submitNewTask() {
    const taskName = newTaskName.trim();
    if (!taskName) {
      setAdding(false);
      return;
    }
    // Emptied before the request rather than after it, so the next task can be typed while this
    // one is still saving. A failed save puts the text back, unless something newer was typed.
    setNewTaskName('');
    try {
      await createMutation.mutateAsync(taskName);
    } catch (caught) {
      setNewTaskName((current) => current || taskName);
      showToast(describeApiError(caught, 'Unable to add the task. Please try again.'), 'error');
    } finally {
      // The refetch re-renders the list around this field, so the caret is put back explicitly.
      newTaskRef.current?.focus();
    }
  }

  function handleNewTaskKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submitNewTask();
    } else if (event.key === 'Escape') {
      setNewTaskName('');
      setAdding(false);
    }
  }

  const onEditSubmit = form.handleSubmit(async (values) => {
    if (!editingItem) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({ id: editingItem.id, values });
    } catch (caught) {
      setFormError(describeApiError(caught, 'Unable to update the task. Please try again.'));
    }
  });

  function changeItemStatus(item: TaskItemDetail, status: TaskItemStatus) {
    if (item.status === status) return;
    statusMutation.mutate({ id: item.id, status });
  }

  // The checkbox is the primary interaction in scope.md's screen layout: ticking completes a task
  // (recording the completion time server-side), unticking reopens it as Pending.
  function toggleComplete(item: TaskItemDetail) {
    changeItemStatus(item, item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED');
  }

  async function confirmDeleteItem() {
    if (!deletingItem) return;
    try {
      await deleteMutation.mutateAsync(deletingItem.id);
    } catch (caught) {
      showToast(describeApiError(caught, 'Unable to delete the task.'), 'error');
    }
  }

  function openAdd() {
    setAdding(true);
  }

  const isDraft = group.status === 'DRAFT';
  // Mirrors the server rule (task-plan/service.ts changeGroupStatus): a group can only be pulled
  // back to draft while none of its tasks have been started, so the action is hidden rather than
  // offered and then refused.
  const canRevertToDraft = !isDraft && group.items.every((item) => item.status === 'PENDING');
  const isComplete = !isDraft && group.totalTasks > 0 && group.completedTasks === group.totalTasks;
  // Only the row being changed waits — a slow request on one task never freezes its neighbours.
  const busyItemId = statusMutation.isPending ? (statusMutation.variables?.id ?? null) : null;
  const hiddenTaskCount = group.items.length - visibleItems.length;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: '16px',
        mb: 2,
        overflow: 'hidden',
        // A draft reads as a plan on the side: dashed edge, muted surface, no progress bar.
        borderStyle: isDraft ? 'dashed' : 'solid',
        bgcolor: isDraft ? 'action.hover' : 'background.paper',
      }}
    >
      {/* The whole header toggles the card, the way an accordion does — the chevron alone is a
          small target on a phone. Controls inside it stop the click from reaching this handler. */}
      <Stack
        direction="row"
        spacing={1.5}
        onClick={onToggleExpanded}
        sx={{
          alignItems: 'center',
          px: { xs: 1.5, sm: 2.5 },
          py: 2,
          flexWrap: 'wrap',
          rowGap: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpanded();
          }}
          aria-label={expanded ? 'Collapse task group' : 'Expand task group'}
          aria-expanded={expanded}
          sx={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms' }}
        >
          <ExpandMoreIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 180 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {group.title}
            </Typography>
            {isDraft && <StatusBadge type="taskGroup" status={group.status} />}
            {isComplete && (
              <Chip size="small" color="success" variant="outlined" icon={<DoneAllIcon />} label="All done" />
            )}
          </Stack>
          {group.description && (
            <Typography variant="body2" color="text.secondary">
              {group.description}
            </Typography>
          )}
          {isDraft && (
            <Typography variant="caption" color="text.secondary">
              Not counted in this order's progress until it is published.
            </Typography>
          )}
        </Box>

        {isDraft ? (
          <Stack sx={{ minWidth: 180, flexGrow: { xs: 1, sm: 0 }, alignItems: { sm: 'flex-end' } }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {group.totalTasks} task{group.totalTasks === 1 ? '' : 's'} planned
            </Typography>
            {canEdit && (
              <Button
                size="small"
                variant="contained"
                startIcon={<PublishIcon />}
                sx={{ mt: 0.75 }}
                disabled={statusChangeMutation.isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  void changeGroupStatus('PUBLISHED');
                }}
              >
                Publish
              </Button>
            )}
          </Stack>
        ) : (
          <Stack sx={{ minWidth: 180, flexGrow: { xs: 1, sm: 0 } }}>
            <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
              {group.completedTasks} / {group.totalTasks} Completed
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
              <LinearProgress
                variant="determinate"
                value={group.progressPercent}
                color={isComplete ? 'success' : 'primary'}
                sx={{ flexGrow: 1, height: 6, borderRadius: 999 }}
              />
              <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 34, textAlign: 'right' }}>
                {group.progressPercent}%
              </Typography>
            </Stack>
          </Stack>
        )}

        <Stack direction="row" spacing={0.5} onClick={(event) => event.stopPropagation()}>
          {canEdit && canRevertToDraft && (
            <Tooltip title="Move back to draft">
              <IconButton
                size="small"
                disabled={statusChangeMutation.isPending}
                onClick={() => void changeGroupStatus('DRAFT')}
              >
                <UnpublishedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="Edit task group">
              <IconButton size="small" onClick={() => onEditGroup(group)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete task group">
              <IconButton size="small" color="error" onClick={() => onDeleteGroup(group)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pb: 2 }}>
          {group.items.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
              No tasks in this group yet.
            </Typography>
          ) : visibleItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
              None of this group's {group.items.length} task{group.items.length === 1 ? '' : 's'} match the current
              filters.
            </Typography>
          ) : (
            <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
              {visibleItems.map((item) => {
                const rowBusy = busyItemId === item.id;
                return (
                  <Stack
                    key={item.id}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', py: 0.75, flexWrap: 'wrap' }}
                  >
                    {/* A draft is not live work — ticking is held back until the group is
                        published, so completed tasks can never sit outside the order's totals. */}
                    <Tooltip title={isDraft ? 'Publish this group before ticking its tasks' : ''}>
                      <span>
                        <Checkbox
                          checked={item.status === 'COMPLETED'}
                          indeterminate={item.status === 'IN_PROGRESS'}
                          disabled={!canEdit || isDraft || rowBusy}
                          onChange={() => toggleComplete(item)}
                          slotProps={{ input: { 'aria-label': `Mark ${item.taskName} completed` } }}
                        />
                      </span>
                    </Tooltip>
                    <Box sx={{ flexGrow: 1, minWidth: 160 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          textDecoration: item.status === 'COMPLETED' ? 'line-through' : 'none',
                          color: item.status === 'COMPLETED' ? 'text.secondary' : 'text.primary',
                        }}
                      >
                        {item.taskName}
                      </Typography>
                      {itemSubtitle(item) && (
                        <Typography variant="caption" color="text.secondary">
                          {itemSubtitle(item)}
                        </Typography>
                      )}
                    </Box>

                    {/* The badge is also the control for the middle status: scope.md documents
                        Pending → In Progress → Completed, and a checkbox can only express two of
                        the three. Marking a task started is now one click, not a drawer. */}
                    {canEdit && !isDraft ? (
                      <Tooltip title="Change status">
                        {/* The span keeps the tooltip working while the row's own update is in
                            flight, when the button underneath it is disabled. */}
                        <span style={{ display: 'inline-flex' }}>
                          <ButtonBase
                            disabled={rowBusy}
                            aria-label={`Change status of ${item.taskName}`}
                            onClick={(event) => setStatusMenu({ anchor: event.currentTarget, item })}
                            sx={{ borderRadius: 999 }}
                          >
                            <StatusBadge type="task" status={item.status} />
                          </ButtonBase>
                        </span>
                      </Tooltip>
                    ) : (
                      <StatusBadge type="task" status={item.status} />
                    )}

                    <Tooltip title={item.hasPhoto ? 'View completion photo' : 'Add completion photo'}>
                      <IconButton size="small" onClick={() => onOpenPhoto(item)}>
                        {item.hasPhoto ? (
                          <PhotoIcon fontSize="small" color="primary" />
                        ) : (
                          <PhotoCameraIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>

                    {/* Rename, remarks and delete are occasional next to ticking, and four icons
                        per row leave nothing readable on a phone — they fold into one menu. */}
                    {(canEdit || canDelete) && (
                      <Tooltip title="More actions">
                        <IconButton
                          size="small"
                          aria-label={`More actions for ${item.taskName}`}
                          onClick={(event) => setActionMenu({ anchor: event.currentTarget, item })}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          )}

          {hiddenTaskCount > 0 && visibleItems.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {hiddenTaskCount} task{hiddenTaskCount === 1 ? '' : 's'} hidden by the current filters.
            </Typography>
          )}

          {/* Hidden while filtering: a task added into a narrowed list would vanish as soon as it
              was created, which reads as the save having failed. */}
          {canCreate &&
            !filtersActive &&
            (adding ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5 }}>
                <TextField
                  size="small"
                  fullWidth
                  autoFocus
                  inputRef={newTaskRef}
                  placeholder="Task name, then press Enter"
                  value={newTaskName}
                  onChange={(event) => setNewTaskName(event.target.value)}
                  onKeyDown={handleNewTaskKeyDown}
                />
                <Button
                  variant="contained"
                  size="small"
                  disabled={!newTaskName.trim()}
                  onClick={() => void submitNewTask()}
                >
                  Add
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setNewTaskName('');
                    setAdding(false);
                  }}
                >
                  Done
                </Button>
              </Stack>
            ) : (
              <Button size="small" startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={openAdd}>
                Add Task
              </Button>
            ))}
        </Box>
      </Collapse>

      <Menu
        anchorEl={statusMenu?.anchor}
        open={Boolean(statusMenu)}
        onClose={() => setStatusMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { minWidth: 170 } } }}
      >
        <ListSubheader sx={{ lineHeight: 2.2, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Set status
        </ListSubheader>
        {TASK_ITEM_STATUSES.map((option) => (
          <MenuItem
            key={option}
            selected={statusMenu?.item.status === option}
            onClick={() => {
              const item = statusMenu?.item;
              setStatusMenu(null);
              if (item) changeItemStatus(item, option);
            }}
          >
            <StatusBadge type="task" status={option} size="sm" />
          </MenuItem>
        ))}
      </Menu>

      <Menu
        anchorEl={actionMenu?.anchor}
        open={Boolean(actionMenu)}
        onClose={() => setActionMenu(null)}
        slotProps={{ paper: { sx: { minWidth: 170 } } }}
      >
        {canEdit && (
          <MenuItem
            onClick={() => {
              setFormError(null);
              setEditingItem(actionMenu?.item ?? null);
              setActionMenu(null);
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit task</ListItemText>
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => {
              setDeletingItem(actionMenu?.item ?? null);
              setActionMenu(null);
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete task</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <FormDrawer
        open={Boolean(editingItem)}
        title="Edit Task"
        onClose={() => setEditingItem(null)}
        onSave={onEditSubmit}
        saving={updateMutation.isPending}
      >
        <TaskItemFields form={form} error={formError} />
      </FormDrawer>

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="Delete Task?"
        message={`"${deletingItem?.taskName ?? ''}" will be removed from this task group. This cannot be undone.`}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => void confirmDeleteItem()}
        onClose={() => setDeletingItem(null)}
      />
    </Paper>
  );
}

function TaskItemFields({
  form,
  error,
}: {
  form: ReturnType<typeof useForm<TaskItemFormValues>>;
  error: string | null;
}) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <TextField
        label="Task Name"
        fullWidth
        margin="normal"
        error={Boolean(errors.taskName)}
        helperText={errors.taskName?.message}
        {...register('taskName')}
      />
      {/* Controlled rather than registered: MUI's Select is not a native input, so it only
          picks up values pushed by form.reset() when React Hook Form drives it via Controller. */}
      <Controller
        name="status"
        control={form.control}
        render={({ field }) => (
          <TextField
            select
            label="Status"
            fullWidth
            margin="normal"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={Boolean(errors.status)}
            helperText={errors.status?.message}
          >
            {TASK_ITEM_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <TextField
        label="Remarks"
        fullWidth
        margin="normal"
        multiline
        rows={2}
        error={Boolean(errors.remarks)}
        helperText={errors.remarks?.message}
        {...register('remarks')}
      />
    </>
  );
}
