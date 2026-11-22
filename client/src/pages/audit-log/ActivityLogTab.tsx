import HistoryIcon from '@mui/icons-material/History';
import { Box, Chip, InputLabel, MenuItem, TextField } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { DatePickerField } from '../../components/DatePickerField';
import { SearchBar } from '../../components/SearchBar';
import { usePermission } from '../../hooks/usePermission';
import * as auditLogService from '../../services/auditLogService';
import * as userService from '../../services/userService';
import type { AuditLogEntry } from '../../types/auditLog';
import { formatDateTime } from '../../utils/format';
import { toOptionalId } from '../../utils/ids';
import { ReportFilterBar } from '../reports/ReportFilterBar';
import { AuditLogDetailDialog } from './AuditLogDetailDialog';
import { actionColor, actionLabel, moduleLabel } from './auditLogLabels';

/** Who did what, and when — a read-only view of the activity log every module writes to. */
export default function ActivityLogTab() {
  const navigate = useNavigate();
  const canExport = usePermission('AUDIT_LOG', 'canExport');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const { data: filterOptions } = useQuery({
    queryKey: ['audit-log', 'filters'],
    queryFn: () => auditLogService.getFilterOptions(),
  });

  const { data: users } = useQuery({
    queryKey: ['user-options'],
    queryFn: () => userService.listActive(),
  });

  // The picked days become the start of the first and the end of the last, in the user's own time
  // zone, so "21 Nov" covers that whole local day.
  const filters = {
    page,
    limit,
    search: search || undefined,
    module: module || undefined,
    action: action || undefined,
    userId: toOptionalId(userId),
    dateFrom: dateFrom?.startOf('day').toISOString(),
    dateTo: dateTo?.endOf('day').toISOString(),
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['audit-log', filters],
    queryFn: () => auditLogService.list(filters),
    placeholderData: keepPreviousData,
  });

  const filtersActive = Boolean(search || module || action || userId || dateFrom || dateTo);

  function resetFilters() {
    setSearch('');
    setModule('');
    setAction('');
    setUserId('');
    setDateFrom(null);
    setDateTo(null);
    setPage(1);
  }

  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: 'performedAt',
      header: 'When',
      width: 170,
      render: (row) => <span className="tw-whitespace-nowrap">{formatDateTime(row.performedAt)}</span>,
      exportValue: (row) => formatDateTime(row.performedAt),
    },
    {
      key: 'user',
      header: 'User',
      width: 170,
      render: (row) =>
        row.performedBy ? (
          <div className="tw-min-w-0">
            <div className="tw-truncate tw-font-semibold tw-leading-tight">{row.performedBy.fullName}</div>
            <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
              @{row.performedBy.username}
            </div>
          </div>
        ) : (
          <span className="tw-text-ink-muted dark:tw-text-ink-dark-muted">System</span>
        ),
      exportValue: (row) => row.performedBy?.fullName ?? 'System',
    },
    {
      key: 'module',
      header: 'Module',
      width: 150,
      render: (row) => moduleLabel(row.module),
      exportValue: (row) => moduleLabel(row.module),
    },
    {
      key: 'action',
      header: 'Action',
      width: 160,
      render: (row) => (
        <Chip size="small" variant="outlined" color={actionColor(row.action)} label={actionLabel(row.action)} />
      ),
      exportValue: (row) => actionLabel(row.action),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => row.description || '—',
      exportValue: (row) => row.description ?? '',
    },
    {
      key: 'referenceId',
      header: 'Record',
      width: 90,
      align: 'center',
      render: (row) => `#${row.referenceId}`,
      exportValue: (row) => String(row.referenceId),
    },
  ];

  return (
    <Box>
      <ReportFilterBar onClear={resetFilters} active={filtersActive}>
        <DatePickerField
          label="From"
          margin="none"
          value={dateFrom}
          maxDate={dateTo ?? undefined}
          onChange={(value) => {
            setDateFrom(value);
            setPage(1);
          }}
        />
        <DatePickerField
          label="To"
          margin="none"
          value={dateTo}
          minDate={dateFrom ?? undefined}
          onChange={(value) => {
            setDateTo(value);
            setPage(1);
          }}
        />
        <TextField
          select
          label="Module"
          value={module}
          onChange={(event) => {
            setModule(event.target.value);
            setPage(1);
          }}
        >
          <MenuItem value="">All Modules</MenuItem>
          {filterOptions?.modules.map((key) => (
            <MenuItem key={key} value={key}>
              {moduleLabel(key)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Action"
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setPage(1);
          }}
        >
          <MenuItem value="">All Actions</MenuItem>
          {filterOptions?.actions.map((key) => (
            <MenuItem key={key} value={key}>
              {actionLabel(key)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="User"
          value={userId}
          onChange={(event) => {
            setUserId(event.target.value);
            setPage(1);
          }}
        >
          <MenuItem value="">All Users</MenuItem>
          {users?.map((user) => (
            <MenuItem key={user.id} value={String(user.id)}>
              {user.fullName}
            </MenuItem>
          ))}
        </TextField>
        {/* SearchBar is a plain input with no label of its own; labelled the same way as the MUI
            fields beside it so every box in the row sits on one line. */}
        <Box>
          <InputLabel>Search</InputLabel>
          <SearchBar
            fullWidth
            value={search}
            placeholder="Search description…"
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
        </Box>
      </ReportFilterBar>

      <DataTable
        showSerialNumber
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
        onRowClick={setSelected}
        onRefresh={() => void refetch()}
        refreshing={isFetching}
        exportFileName="audit-log"
        canExport={canExport}
        emptyState={{
          icon: <HistoryIcon sx={{ fontSize: 36 }} />,
          title: 'No entries found',
          description: filtersActive
            ? 'Nothing in the log matches these filters. Reset them to see every entry.'
            : 'Nothing has been recorded yet.',
        }}
      />

      <AuditLogDetailDialog
        entry={selected}
        onClose={() => setSelected(null)}
        onOpenRecord={(path) => {
          setSelected(null);
          navigate(path);
        }}
      />
    </Box>
  );
}
