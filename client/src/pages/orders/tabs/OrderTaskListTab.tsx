import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import ChecklistIcon from '@mui/icons-material/Checklist';
import EditIcon from '@mui/icons-material/Edit';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { DatePickerField } from '../../../components/DatePickerField';
import { FormDrawer } from '../../../components/FormDrawer';
import { StatusBadge } from '../../../components/StatusBadge';
import { usePermission } from '../../../hooks/usePermission';
import * as taskService from '../../../services/taskService';
import * as userService from '../../../services/userService';
import type { ApiErrorResponse } from '../../../types/api';
import type { OrderDetail } from '../../../types/order';
import type { OrderTaskDetail, TaskCategory, TaskStatus, UpdateTaskInput } from '../../../types/task';
import { formatDate } from '../../../utils/format';
import { createTaskSchema, updateTaskSchema, type CreateTaskFormValues, type UpdateTaskFormValues } from '../../../validation/taskSchemas';
import { TASK_STATUS_TRANSITIONS } from '../taskStatusTransitions';

interface OrderTaskListTabProps {
  order: OrderDetail;
  taskCategory: TaskCategory;
  title: string;
}

function OverviewTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        minWidth: 84,
        borderRadius: '12px',
        textAlign: 'center',
        border: '1px solid',
        borderColor: `color-mix(in srgb, ${tone} 35%, transparent)`,
        bgcolor: `color-mix(in srgb, ${tone} 10%, transparent)`,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700, color: tone }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

function taskSubtitle(task: OrderTaskDetail): string {
  const parts: string[] = [];
  if (task.assignedTo) parts.push(`Assigned to ${task.assignedTo.fullName}`);
  if (task.dueDate) parts.push(`Due ${formatDate(task.dueDate)}`);
  if (task.status === 'COMPLETED' && task.completedBy) {
    parts.push(`Completed by ${task.completedBy.fullName}${task.completedDate ? ` on ${formatDate(task.completedDate)}` : ''}`);
  }
  if (task.remarks) parts.push(`Remarks: ${task.remarks}`);
  return parts.join(' • ');
}

export default function OrderTaskListTab({ order, taskCategory, title }: OrderTaskListTabProps) {
  const queryClient = useQueryClient();
  const canView = usePermission('PLANNING', 'canView');
  const canCreate = usePermission('PLANNING', 'canCreate');
  const canEdit = usePermission('PLANNING', 'canEdit');

  const [addOpen, setAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OrderTaskDetail | null>(null);
  const [skippingTask, setSkippingTask] = useState<OrderTaskDetail | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const tasksQueryKey = ['order-tasks', order.id, taskCategory];

  const { data: tasks, isLoading } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => taskService.listForOrder(order.id, taskCategory),
    enabled: canView,
  });

  const { data: users } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => userService.listActive(),
    enabled: addOpen || Boolean(editingTask),
  });

  function invalidateTasks() {
    queryClient.invalidateQueries({ queryKey: tasksQueryKey });
  }

  const createForm = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { taskName: '', assignedToId: '', dueDate: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: CreateTaskFormValues) =>
      taskService.create(order.id, {
        taskName: values.taskName,
        taskCategory,
        assignedToId: values.assignedToId || undefined,
        dueDate: values.dueDate || undefined,
      }),
    onSuccess: () => {
      invalidateTasks();
      setAddOpen(false);
      createForm.reset();
    },
  });

  const onCreateSubmit = createForm.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createMutation.mutateAsync(values);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Unable to add task. Please try again.');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; data: UpdateTaskInput }) => taskService.update(input.id, input.data),
    onSuccess: () => invalidateTasks(),
  });

  async function toggleComplete(task: OrderTaskDetail) {
    if (!TASK_STATUS_TRANSITIONS[task.status].includes('COMPLETED')) return;
    try {
      await updateMutation.mutateAsync({ id: task.id, data: { status: 'COMPLETED' } });
    } catch {
      // Surfaced via the row remaining unchecked; a toast system isn't part of this app yet.
    }
  }

  async function confirmSkip() {
    if (!skippingTask) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({ id: skippingTask.id, data: { status: 'SKIPPED' } });
      setSkippingTask(null);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Unable to skip task.');
      }
    }
  }

  const editForm = useForm<UpdateTaskFormValues>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: { status: 'PENDING', assignedToId: '', dueDate: '', remarks: '' },
  });

  useEffect(() => {
    if (editingTask) {
      editForm.reset({
        status: editingTask.status,
        assignedToId: editingTask.assignedTo?.id ?? '',
        dueDate: editingTask.dueDate ?? '',
        remarks: editingTask.remarks ?? '',
      });
    }
  }, [editingTask, editForm]);

  const onEditSubmit = editForm.handleSubmit(async (values) => {
    if (!editingTask) return;
    setFormError(null);
    const payload: UpdateTaskInput = {
      assignedToId: values.assignedToId || undefined,
      dueDate: values.dueDate || undefined,
      remarks: values.remarks || undefined,
    };
    // Only send `status` when it actually changed — the backend's transition guard checks the
    // new value against the CURRENT status's allowed-next list, which never includes itself, so
    // resending an unchanged status would be rejected as an invalid transition.
    if (values.status !== editingTask.status) payload.status = values.status as TaskStatus;

    try {
      await updateMutation.mutateAsync({ id: editingTask.id, data: payload });
      setEditingTask(null);
    } catch (error) {
      if (isAxiosError<ApiErrorResponse>(error) && error.response) {
        setFormError(error.response.data.message);
      } else {
        setFormError('Unable to update task. Please try again.');
      }
    }
  });

  const statusOptions: TaskStatus[] = editingTask
    ? [editingTask.status, ...TASK_STATUS_TRANSITIONS[editingTask.status]]
    : [];

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view this tab.</Typography>;
  }

  if (isLoading) return <CircularProgress size={28} />;

  // "md files/order/view.md" §Planning Tab — lead with an at-a-glance overview instead of a bare
  // "no tasks yet" line, and make the empty state actively invite the first task.
  const allTasks = tasks ?? [];
  const completedCount = allTasks.filter((task) => task.status === 'COMPLETED').length;
  const pendingCount = allTasks.length - completedCount;
  const progress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', mb: 2.5 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 2 }}
        >
          <Box sx={{ minWidth: 200, flexGrow: 1 }}>
            <Typography variant="h4">{title} Overview</Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ flexGrow: 1, height: 8, borderRadius: 999 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 42, textAlign: 'right' }}>
                {progress}%
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <OverviewTile label="Tasks" value={allTasks.length} tone="#2563EB" />
            <OverviewTile label="Completed" value={completedCount} tone="#22C55E" />
            <OverviewTile label="Pending" value={pendingCount} tone="#F59E0B" />
          </Stack>

          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
              Add Task
            </Button>
          )}
        </Stack>
      </Paper>

      {allTasks.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, borderRadius: '16px', textAlign: 'center' }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 1.5,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              bgcolor: 'rgba(37, 99, 235, 0.08)',
            }}
          >
            <ChecklistIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            No {title.toLowerCase()} tasks have been created.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Break the work into tasks so the team knows what happens next.
          </Typography>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2.5 }} onClick={() => setAddOpen(true)}>
              Create {title} Task
            </Button>
          )}
        </Paper>
      ) : (
        <List>
          {allTasks.map((task) => {
            const isTerminal = TASK_STATUS_TRANSITIONS[task.status].length === 0;
            const canComplete = canEdit && TASK_STATUS_TRANSITIONS[task.status].includes('COMPLETED');
            const canSkip = canEdit && TASK_STATUS_TRANSITIONS[task.status].includes('SKIPPED');
            return (
              <ListItem
                key={task.id}
                divider
                secondaryAction={
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <StatusBadge type="task" status={task.status} />
                    {canSkip && (
                      <Tooltip title="Skip task">
                        <IconButton size="small" onClick={() => setSkippingTask(task)}>
                          <NotInterestedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEdit && (
                      <Tooltip title="Edit task">
                        <IconButton size="small" onClick={() => setEditingTask(task)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                }
              >
                <Checkbox
                  checked={task.status === 'COMPLETED'}
                  disabled={!canComplete && task.status !== 'COMPLETED'}
                  onChange={() => toggleComplete(task)}
                  sx={{ mr: 1 }}
                />
                <ListItemText
                  primary={task.taskName}
                  secondary={taskSubtitle(task) || (isTerminal ? undefined : 'No details yet.')}
                  sx={{ pr: 12 }}
                />
              </ListItem>
            );
          })}
        </List>
      )}

      <FormDrawer
        open={addOpen}
        title={`Add ${title} Task`}
        onClose={() => setAddOpen(false)}
        onSave={onCreateSubmit}
        saving={createMutation.isPending}
      >
        {formError && !editingTask && !skippingTask && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <TextField
          label="Task Name"
          fullWidth
          margin="normal"
          error={Boolean(createForm.formState.errors.taskName)}
          helperText={createForm.formState.errors.taskName?.message}
          {...createForm.register('taskName')}
        />
        <TextField select label="Assigned To" fullWidth margin="normal" {...createForm.register('assignedToId')}>
          <MenuItem value="">Unassigned</MenuItem>
          {users?.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.fullName}
            </MenuItem>
          ))}
        </TextField>
        <Controller
          name="dueDate"
          control={createForm.control}
          render={({ field }) => (
            <DatePickerField
              label="Due Date"
              value={field.value ? dayjs(field.value) : null}
              onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
            />
          )}
        />
      </FormDrawer>

      <FormDrawer
        open={Boolean(editingTask)}
        title="Update Task"
        onClose={() => setEditingTask(null)}
        onSave={onEditSubmit}
        saving={updateMutation.isPending}
      >
        {formError && editingTask && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        {editingTask && (
          <>
            <Typography variant="subtitle2">{editingTask.taskName}</Typography>
            <TextField
              select
              label="Status"
              fullWidth
              margin="normal"
              disabled={!canEdit || statusOptions.length <= 1}
              {...editForm.register('status')}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.replaceAll('_', ' ')}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Assigned To" fullWidth margin="normal" {...editForm.register('assignedToId')}>
              <MenuItem value="">Unassigned</MenuItem>
              {users?.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.fullName}
                </MenuItem>
              ))}
            </TextField>
            <Controller
              name="dueDate"
              control={editForm.control}
              render={({ field }) => (
                <DatePickerField
                  label="Due Date"
                  value={field.value ? dayjs(field.value) : null}
                  onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                />
              )}
            />
            <TextField label="Remarks" fullWidth margin="normal" multiline rows={2} {...editForm.register('remarks')} />
          </>
        )}
      </FormDrawer>

      <ConfirmDialog
        open={Boolean(skippingTask)}
        title="Skip Task?"
        message={
          <>
            {formError && skippingTask && <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert>}
            Mark "{skippingTask?.taskName}" as skipped? This cannot be undone.
          </>
        }
        danger
        loading={updateMutation.isPending}
        onConfirm={confirmSkip}
        onClose={() => setSkippingTask(null)}
      />
    </>
  );
}
