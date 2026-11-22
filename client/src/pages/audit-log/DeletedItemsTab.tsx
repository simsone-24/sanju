import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { Box, Button, Paper, Tab, Tabs, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { SearchBar } from '../../components/SearchBar';
import { StatusBadge } from '../../components/StatusBadge';
import type { StatusBadgeType } from '../../components/statusConfig';
import { usePermission } from '../../hooks/usePermission';
import * as auditLogService from '../../services/auditLogService';
import type { DeletedItemRow, DeletedItemType } from '../../types/auditLog';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { useRestoreDeletedItem } from './deletedItemRestore';

// Only these kinds carry a status the app already knows how to badge; the rest have none to show.
const STATUS_BADGE_TYPE: Partial<Record<DeletedItemType, StatusBadgeType>> = {
  ENQUIRIES: 'enquiry',
  QUOTATIONS: 'quotation',
  ORDERS: 'order',
};

// Whether a kind has a money value worth a column.
const HAS_AMOUNT: Record<DeletedItemType, boolean> = {
  ENQUIRIES: false,
  QUOTATIONS: true,
  ORDERS: true,
  PAYMENTS: true,
  EXPENSES: true,
  USERS: false,
};

const SINGULAR: Record<DeletedItemType, string> = {
  ENQUIRIES: 'enquiries',
  QUOTATIONS: 'quotations',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  USERS: 'users',
};

/**
 * Everything that has been soft-deleted, one kind at a time. Read-only: a delete keeps the record, and
 * this is where it can still be found — who deleted it, when, and (for records taken by a cascade) the
 * parent whose deletion took it.
 */
export default function DeletedItemsTab() {
  const navigate = useNavigate();
  const canExport = usePermission('AUDIT_LOG', 'canExport');
  const [selectedType, setSelectedType] = useState<DeletedItemType | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['audit-log', 'deleted', 'summary'],
    queryFn: () => auditLogService.getDeletedSummary(),
  });

  // Opens on the first kind that actually has something in it, rather than on an empty list.
  const activeType: DeletedItemType = selectedType ?? summary?.find((entry) => entry.count > 0)?.type ?? 'ENQUIRIES';

  const params = { type: activeType, page, limit, search: search || undefined };
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['audit-log', 'deleted', params],
    queryFn: () => auditLogService.listDeleted(params),
    placeholderData: keepPreviousData,
  });

  function selectType(type: DeletedItemType) {
    setSelectedType(type);
    setPage(1);
    setSearch('');
  }

  const badgeType = STATUS_BADGE_TYPE[activeType];
  const { canRestore, request: requestRestore, dialog: restoreDialog } = useRestoreDeletedItem(activeType);

  const columns: DataTableColumn<DeletedItemRow>[] = [
    {
      key: 'reference',
      header: 'Reference',
      width: 170,
      render: (row) => <span className="tw-font-bold tw-tabular-nums">{row.reference}</span>,
      exportValue: (row) => row.reference,
    },
    {
      key: 'title',
      header: 'Details',
      render: (row) => (
        <div className="tw-min-w-0">
          <div className="tw-truncate tw-font-semibold tw-leading-tight">{row.title}</div>
          {row.detail && (
            <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">{row.detail}</div>
          )}
        </div>
      ),
      exportValue: (row) => [row.title, row.detail].filter(Boolean).join(' — '),
    },
    ...(HAS_AMOUNT[activeType]
      ? [
          {
            key: 'amount',
            header: 'Amount',
            align: 'center' as const,
            width: 130,
            render: (row: DeletedItemRow) =>
              row.amount !== null ? <span className="tw-tabular-nums">{formatCurrency(row.amount)}</span> : '—',
            exportValue: (row: DeletedItemRow) => row.amount ?? '',
          },
        ]
      : []),
    ...(badgeType
      ? [
          {
            key: 'status',
            header: 'Status',
            align: 'center' as const,
            width: 150,
            render: (row: DeletedItemRow) =>
              row.status ? <StatusBadge type={badgeType} status={row.status} size="sm" /> : '—',
            exportValue: (row: DeletedItemRow) => row.status ?? '',
          },
        ]
      : []),
    {
      key: 'deletedAt',
      header: 'Deleted On',
      width: 170,
      render: (row) => <span className="tw-whitespace-nowrap">{formatDateTime(row.deletedAt)}</span>,
      exportValue: (row) => formatDateTime(row.deletedAt),
    },
    {
      key: 'deletedBy',
      header: 'Deleted By',
      width: 200,
      render: (row) =>
        row.deletedBy ? (
          <div className="tw-min-w-0">
            <div className="tw-truncate tw-font-semibold tw-leading-tight">{row.deletedBy.fullName}</div>
            {/* A record taken by a cascade names the parent whose deletion took it. */}
            {row.deletedWith && (
              <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
                with {row.deletedWith}
              </div>
            )}
          </div>
        ) : (
          <span className="tw-text-ink-muted dark:tw-text-ink-dark-muted">Not recorded</span>
        ),
      exportValue: (row) =>
        row.deletedBy ? `${row.deletedBy.fullName}${row.deletedWith ? ` (with ${row.deletedWith})` : ''}` : '',
    },
    ...(canRestore
      ? [
          {
            key: 'restore',
            header: 'Actions',
            align: 'center' as const,
            width: 130,
            render: (row: DeletedItemRow) => (
              <Button
                size="small"
                variant="outlined"
                startIcon={<RestoreFromTrashIcon fontSize="small" />}
                aria-label={`Restore ${row.reference}`}
                onClick={(event) => {
                  // The row itself opens the view page; this button must not.
                  event.stopPropagation();
                  requestRestore(row);
                }}
              >
                Restore
              </Button>
            ),
            exportValue: () => '',
          },
        ]
      : []),
  ];

  return (
    <Box>
      <Paper variant="outlined" sx={{ borderRadius: '12px', mb: 2 }}>
        <Tabs
          value={activeType}
          onChange={(_event, value: DeletedItemType) => selectType(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Deleted item type"
          sx={{ px: 1 }}
        >
          {(summary ?? []).map((entry) => (
            <Tab key={entry.type} value={entry.type} label={`${entry.label} (${entry.count.toLocaleString('en-IN')})`} />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <SearchBar
          value={search}
          placeholder={`Search deleted ${SINGULAR[activeType]}…`}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
        />
      </Box>

      <DataTable
        key={activeType}
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
        onRowClick={(row) => navigate(`/audit-log/deleted/${activeType}/${row.id}`)}
        onRefresh={() => void refetch()}
        refreshing={isFetching}
        exportFileName={`deleted-${SINGULAR[activeType]}`}
        canExport={canExport}
        emptyState={{
          icon: <DeleteSweepIcon sx={{ fontSize: 36 }} />,
          title: `No deleted ${SINGULAR[activeType]}`,
          description: search
            ? 'Nothing deleted matches this search.'
            : 'Nothing of this kind has been deleted.',
        }}
      />

      {restoreDialog}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Deleted records are kept, not erased. They no longer appear in their own module until restored; restoring
        brings back a record together with what was deleted along with it.
      </Typography>
    </Box>
  );
}
