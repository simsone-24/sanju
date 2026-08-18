import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import ChecklistIcon from '@mui/icons-material/Checklist';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { FormDrawer } from '../../../components/FormDrawer';
import { usePermission } from '../../../hooks/usePermission';
import * as taskPlanService from '../../../services/taskPlanService';
import { useToast } from '../../../store/ToastContext';
import type { OrderDetail } from '../../../types/order';
import type { TaskGroupDetail, TaskGroupStatus, TaskItemDetail, TaskItemStatus } from '../../../types/taskPlan';
import { describeApiError } from '../../../utils/apiError';
import { taskGroupSchema, type TaskGroupFormValues } from '../../../validation/taskPlanSchemas';
import { TaskItemPhotoDialog } from '../TaskItemPhotoDialog';
import { TaskPlanGroupCard } from '../TaskPlanGroupCard';

interface OrderTaskPlanTabProps {
  order: OrderDetail;
}

// scope.md §Task Group's own worked examples, offered as one-tap chips so the common groups can
// be named without typing. They only prefill the title — every group stays fully editable.
const SUGGESTED_GROUP_TITLES = [
  'Chair Allocation',
  'Stage Decoration',
  'Dining Arrangement',
  'Lighting Setup',
  'Sound System',
  'Generator Setup',
  'Return Packing',
  'Cleaning',
] as const;

const EMPTY_GROUP_FORM: TaskGroupFormValues = {
  title: '',
  description: '',
  // One blank row so the tasks section is immediately usable rather than needing a click first.
  items: [{ taskName: '' }],
};

type TaskStatusFilter = TaskItemStatus | 'ALL';

const STATUS_FILTERS: { key: TaskStatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
];

/** A group paired with the tasks left after the toolbar's search and status filters. */
interface FilteredGroup {
  group: TaskGroupDetail;
  items: TaskItemDetail[];
  /** The group's own title/description matched the search, so all of its tasks stay visible. */
  titleMatches: boolean;
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

// The creation form is two clearly separated steps — name the group, then list its tasks — so a
// long checklist never reads as one undifferentiated column of inputs.
function StepHeading({ step, title, hint, trailing }: { step: number; title: string; hint?: string; trailing?: ReactNode }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
      <Box
        sx={(theme) => ({
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'primary.main',
          backgroundColor: `color-mix(in srgb, ${(theme.vars ?? theme).palette.primary.main} 14%, transparent)`,
        })}
      >
        {step}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {title}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
      <Box sx={{ ml: 'auto' }}>{trailing}</Box>
    </Stack>
  );
}

/**
 * Task Plan — "md files/task plan/scope.md". Replaces the previous separate Planning and Task
 * Checklist tabs with a single flexible view: any number of user-defined task groups, each an
 * expandable card holding its own tasks and showing its own dynamically calculated progress.
 *
 * A finished plan can run to dozens of tasks across many groups, so the list is searchable,
 * filterable by status, and collapsible in one action rather than only card by card.
 */
export default function OrderTaskPlanTab({ order }: OrderTaskPlanTabProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canView = usePermission('PLANNING', 'canView');
  const canCreate = usePermission('PLANNING', 'canCreate');
  const canEdit = usePermission('PLANNING', 'canEdit');
  const canDelete = usePermission('PLANNING', 'canDelete');

  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TaskGroupDetail | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<TaskGroupDetail | null>(null);
  const [photoItem, setPhotoItem] = useState<TaskItemDetail | null>(null);
  /** Index of the task row that should take focus after the next render (append / Enter). */
  const [autoFocusRow, setAutoFocusRow] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('ALL');
  /** Cards are open by default, so only the closed ones need remembering. */
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<number>>(() => new Set<number>());

  const taskPlanQueryKey = ['order-task-plan', order.id] as const;

  const { data: groups, isLoading } = useQuery({
    queryKey: taskPlanQueryKey,
    queryFn: () => taskPlanService.listForOrder(order.id),
    enabled: canView,
  });

  const form = useForm<TaskGroupFormValues>({
    resolver: zodResolver(taskGroupSchema),
    defaultValues: EMPTY_GROUP_FORM,
  });
  const taskRows = useFieldArray({ control: form.control, name: 'items' });

  // Live values, so the suggestion chips show which one is selected and the task counter keeps up
  // with what has actually been typed rather than with the number of rows on screen.
  const groupTitle = form.watch('title');
  const taskValues = form.watch('items') ?? [];
  const filledTaskCount = taskValues.filter((row) => row.taskName?.trim()).length;

  const normalizedSearch = search.trim().toLowerCase();
  const filtersActive = normalizedSearch.length > 0 || statusFilter !== 'ALL';

  useEffect(() => {
    if (editingGroup) {
      // Editing only covers the group's own fields — its tasks are managed inline on the card,
      // where they can be ticked and reordered in context.
      form.reset({ title: editingGroup.title, description: editingGroup.description ?? '', items: [] });
    }
  }, [editingGroup, form]);

  // Matches inside a collapsed card would be invisible, so starting to filter opens everything
  // once. Individual cards can still be closed again while the filter stays on.
  useEffect(() => {
    if (filtersActive) setCollapsedIds(new Set<number>());
  }, [filtersActive]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: taskPlanQueryKey });
  }

  function closeGroupForm() {
    setGroupFormOpen(false);
    setEditingGroup(null);
    form.reset(EMPTY_GROUP_FORM);
  }

  const saveGroupMutation = useMutation({
    mutationFn: ({ values, status }: { values: TaskGroupFormValues; status: TaskGroupStatus }) => {
      const payload = { title: values.title, description: values.description || undefined };
      // Editing covers the group's own fields only — its draft/published state is changed from the
      // card itself, where the tasks it affects are visible.
      if (editingGroup) return taskPlanService.updateGroup(editingGroup.id, payload);

      // Rows the user left blank are simply not tasks — dropped rather than rejected.
      const items = values.items
        .map((row) => row.taskName.trim())
        .filter(Boolean)
        .map((taskName) => ({ taskName }));
      return taskPlanService.createGroup(order.id, { ...payload, status, items });
    },
    onSuccess: (savedGroup, variables) => {
      invalidate();
      showToast(
        editingGroup
          ? 'Task group updated.'
          : variables.status === 'DRAFT'
            ? `"${savedGroup.title}" saved as a draft.`
            : `"${savedGroup.title}" published to the team.`,
      );
      closeGroupForm();
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => taskPlanService.deleteGroup(id),
    onSuccess: () => {
      invalidate();
      showToast(`"${deletingGroup?.title ?? 'Task group'}" deleted.`);
      setDeletingGroup(null);
    },
  });

  // Both footer buttons run the same validated submit — they differ only in the status the new
  // group is saved with, so a draft can never skip the checks a published group goes through.
  function submitGroupAs(status: TaskGroupStatus) {
    return form.handleSubmit(async (values) => {
      setFormError(null);
      try {
        await saveGroupMutation.mutateAsync({ values, status });
      } catch (caught) {
        setFormError(describeApiError(caught, 'Unable to save the task group. Please try again.'));
      }
    });
  }

  const onGroupSubmit = submitGroupAs('PUBLISHED');
  const onGroupSubmitDraft = submitGroupAs('DRAFT');

  async function confirmDeleteGroup() {
    if (!deletingGroup) return;
    try {
      await deleteGroupMutation.mutateAsync(deletingGroup.id);
    } catch (caught) {
      showToast(describeApiError(caught, 'Unable to delete the task group.'), 'error');
    }
  }

  function openAddGroup() {
    setEditingGroup(null);
    setFormError(null);
    form.reset(EMPTY_GROUP_FORM);
    setGroupFormOpen(true);
  }

  function addTaskRow() {
    taskRows.append({ taskName: '' });
    setAutoFocusRow(taskRows.fields.length);
  }

  // Enter moves to the next task instead of submitting the form, so a whole checklist can be
  // typed straight through without reaching for the mouse.
  function handleTaskRowKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (index === taskRows.fields.length - 1) taskRows.append({ taskName: '' });
    setAutoFocusRow(index + 1);
  }

  function openEditGroup(group: TaskGroupDetail) {
    setFormError(null);
    setEditingGroup(group);
    setGroupFormOpen(true);
  }

  function toggleExpanded(groupId: number) {
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function clearFilters() {
    setSearch('');
    setStatusFilter('ALL');
  }

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view the task plan.</Typography>;
  }

  if (isLoading) return <CircularProgress size={28} />;

  const allGroups = groups ?? [];
  // A draft group is a plan still being written, so it stays out of the order's progress — the
  // team is not working on it yet and counting its tasks would understate real completion.
  const liveGroups = allGroups.filter((group) => group.status === 'PUBLISHED');
  const draftGroups = allGroups.length - liveGroups.length;
  const totalTasks = liveGroups.reduce((sum, group) => sum + group.totalTasks, 0);
  const completedTasks = liveGroups.reduce((sum, group) => sum + group.completedTasks, 0);
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Search first: a group whose own title matches keeps all of its tasks, so searching for
  // "Stage Decoration" shows that group's full checklist rather than nothing.
  const searchedGroups: FilteredGroup[] = allGroups.map((group) => {
    const titleMatches =
      normalizedSearch.length === 0 ||
      group.title.toLowerCase().includes(normalizedSearch) ||
      (group.description ?? '').toLowerCase().includes(normalizedSearch);

    const items =
      normalizedSearch.length === 0 || titleMatches
        ? group.items
        : group.items.filter(
            (item) =>
              item.taskName.toLowerCase().includes(normalizedSearch) ||
              (item.remarks ?? '').toLowerCase().includes(normalizedSearch),
          );

    return { group, items, titleMatches };
  });

  // The chip counts describe what the search left behind, so they always add up to what the
  // status filter is choosing between.
  const statusCounts: Record<TaskStatusFilter, number> = { ALL: 0, PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
  searchedGroups.forEach(({ items }) =>
    items.forEach((item) => {
      statusCounts.ALL += 1;
      statusCounts[item.status] += 1;
    }),
  );

  const visibleGroups = searchedGroups
    .map((entry) => ({
      ...entry,
      items: statusFilter === 'ALL' ? entry.items : entry.items.filter((item) => item.status === statusFilter),
    }))
    // A group the search matched by name stays listed even when it holds no tasks yet; a status
    // filter, though, is a question about tasks, so groups with no matching task drop out.
    .filter((entry) => !filtersActive || entry.items.length > 0 || (entry.titleMatches && statusFilter === 'ALL'));

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', mb: 2.5 }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 2 }}
        >
          <Box sx={{ minWidth: 200, flexGrow: 1 }}>
            <Typography variant="h4">Task Plan Overview</Typography>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={overallProgress}
                color={overallProgress === 100 ? 'success' : 'primary'}
                sx={{ flexGrow: 1, height: 8, borderRadius: 999 }}
              />
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 42, textAlign: 'right' }}>
                {overallProgress}%
              </Typography>
            </Stack>
            {draftGroups > 0 && (
              <Typography variant="caption" color="text.secondary">
                {draftGroups} draft group{draftGroups > 1 ? 's' : ''} not counted here — publish to hand them to the
                team.
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
            <OverviewTile label="Live Groups" value={liveGroups.length} tone="#2563EB" />
            <OverviewTile label="Completed" value={completedTasks} tone="#10B981" />
            <OverviewTile label="Pending" value={totalTasks - completedTasks} tone="#F59E0B" />
            {draftGroups > 0 && <OverviewTile label="Drafts" value={draftGroups} tone="#94A3B8" />}
          </Stack>

          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAddGroup}>
              Add Task Group
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Toolbar: find a task by name, narrow to one status, or fold the whole plan away. A plan
          of eight groups is far past what fits on a phone screen card by card. */}
      {allGroups.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '16px', mb: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Search tasks or groups…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ flexGrow: 1, minWidth: 200, maxWidth: 340 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" aria-label="Clear search" onClick={() => setSearch('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />

            <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
              {STATUS_FILTERS.map((filter) => (
                <Chip
                  key={filter.key}
                  size="small"
                  label={`${filter.label} (${statusCounts[filter.key]})`}
                  color={statusFilter === filter.key ? 'primary' : 'default'}
                  variant={statusFilter === filter.key ? 'filled' : 'outlined'}
                  // Clicking the active status again drops back to All, so a filter never needs
                  // two clicks to undo.
                  onClick={() => setStatusFilter((current) => (current === filter.key ? 'ALL' : filter.key))}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
              <Button
                size="small"
                startIcon={<UnfoldMoreIcon />}
                disabled={collapsedIds.size === 0}
                onClick={() => setCollapsedIds(new Set<number>())}
              >
                Expand all
              </Button>
              <Button
                size="small"
                startIcon={<UnfoldLessIcon />}
                disabled={collapsedIds.size === allGroups.length}
                onClick={() => setCollapsedIds(new Set(allGroups.map((group) => group.id)))}
              >
                Collapse all
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {allGroups.length === 0 ? (
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
            No task groups have been created.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Group the event work — chair allocation, stage decoration, lighting — so the team knows what happens
            next.
          </Typography>
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2.5 }} onClick={openAddGroup}>
              Add Task Group
            </Button>
          )}
        </Paper>
      ) : visibleGroups.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, borderRadius: '16px', textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            No tasks match these filters.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {search ? `Nothing in this plan matches "${search.trim()}".` : 'No task is in that status yet.'}
          </Typography>
          <Button variant="outlined" sx={{ mt: 2.5 }} onClick={clearFilters}>
            Clear Filters
          </Button>
        </Paper>
      ) : (
        visibleGroups.map(({ group, items }) => (
          <TaskPlanGroupCard
            key={group.id}
            group={group}
            visibleItems={items}
            filtersActive={filtersActive}
            expanded={!collapsedIds.has(group.id)}
            onToggleExpanded={() => toggleExpanded(group.id)}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
            taskPlanQueryKey={taskPlanQueryKey}
            onEditGroup={openEditGroup}
            onDeleteGroup={setDeletingGroup}
            onOpenPhoto={setPhotoItem}
          />
        ))
      )}

      <FormDrawer
        open={groupFormOpen}
        title={editingGroup ? 'Edit Task Group' : 'Add Task Group'}
        subtitle={
          editingGroup
            ? 'Rename the group or update its description.'
            : 'Name the group, list its tasks, then publish it or keep it as a draft.'
        }
        onClose={closeGroupForm}
        onSave={onGroupSubmit}
        saving={saveGroupMutation.isPending}
        saveLabel={editingGroup ? 'Save' : 'Save & Publish'}
        // Editing never changes the draft/published state — that is done from the group's card.
        secondaryAction={
          editingGroup ? undefined : { label: 'Save as Draft', onClick: () => void onGroupSubmitDraft() }
        }
        width={560}
      >
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        <StepHeading step={1} title="Group" />
        <TextField
          label="Task Group Title"
          placeholder="e.g. Chair Allocation"
          fullWidth
          required
          autoFocus
          error={Boolean(form.formState.errors.title)}
          helperText={form.formState.errors.title?.message}
          {...form.register('title')}
        />

        {!editingGroup && (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}>
            {SUGGESTED_GROUP_TITLES.map((title) => (
              <Chip
                key={title}
                label={title}
                size="small"
                variant={groupTitle === title ? 'filled' : 'outlined'}
                color={groupTitle === title ? 'primary' : 'default'}
                onClick={() => form.setValue('title', title, { shouldValidate: true })}
              />
            ))}
          </Stack>
        )}

        <TextField
          label="Description (Optional)"
          placeholder="Anything the team should know before starting"
          fullWidth
          margin="normal"
          multiline
          rows={2}
          error={Boolean(form.formState.errors.description)}
          helperText={form.formState.errors.description?.message}
          {...form.register('description')}
        />

        {/* scope.md §Add Task Group puts "+ Add Task" directly in this form — the whole checklist
            is typed in one pass instead of one drawer per task. */}
        {!editingGroup && (
          <>
            <Divider sx={{ my: 2.5 }} />
            <StepHeading
              step={2}
              title="Tasks"
              hint="Press Enter for the next one"
              trailing={
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${filledTaskCount} task${filledTaskCount === 1 ? '' : 's'}`}
                  color={filledTaskCount > 0 ? 'primary' : 'default'}
                />
              }
            />

            <Stack spacing={1}>
              {taskRows.fields.map((field, index) => {
                const isTrailingBlank = index === taskRows.fields.length - 1 && !taskValues[index]?.taskName?.trim();
                return (
                  <TextField
                    key={field.id}
                    size="small"
                    fullWidth
                    placeholder={isTrailingBlank ? 'Type a task, then press Enter…' : `Task ${index + 1}`}
                    inputRef={(element: HTMLInputElement | null) => {
                      if (element && autoFocusRow === index) {
                        element.focus();
                        setAutoFocusRow(null);
                      }
                    }}
                    onKeyDown={(event) => handleTaskRowKeyDown(event, index)}
                    error={Boolean(form.formState.errors.items?.[index]?.taskName)}
                    helperText={form.formState.errors.items?.[index]?.taskName?.message}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box
                              sx={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: 'text.secondary',
                                bgcolor: 'action.hover',
                              }}
                            >
                              {index + 1}
                            </Box>
                          </InputAdornment>
                        ),
                        endAdornment:
                          taskRows.fields.length > 1 ? (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                aria-label={`Remove task ${index + 1}`}
                                onClick={() => taskRows.remove(index)}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ) : undefined,
                      },
                    }}
                    {...form.register(`items.${index}.taskName`)}
                  />
                );
              })}
            </Stack>

            <Button size="small" startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={addTaskRow}>
              Add Task
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Blank rows are ignored, and more tasks can be added to the group later. <b>Save as Draft</b> keeps the
              group out of this order's progress until you publish it.
            </Typography>
          </>
        )}
      </FormDrawer>

      <ConfirmDialog
        open={Boolean(deletingGroup)}
        title="Delete Task Group?"
        message={`"${deletingGroup?.title ?? ''}" and all ${deletingGroup?.totalTasks ?? 0} task(s) inside it will be deleted. This cannot be undone.`}
        danger
        loading={deleteGroupMutation.isPending}
        onConfirm={() => void confirmDeleteGroup()}
        onClose={() => setDeletingGroup(null)}
      />

      <TaskItemPhotoDialog
        item={photoItem}
        canEdit={canEdit}
        taskPlanQueryKey={taskPlanQueryKey}
        onClose={() => setPhotoItem(null)}
      />
    </>
  );
}
