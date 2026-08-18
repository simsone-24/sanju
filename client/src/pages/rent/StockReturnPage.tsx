import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as rentService from '../../services/rentService';
import type { StockOutDetail, StockOutSummary, StockReturnStatus } from '../../types/rent';
import { formatDate } from '../../utils/format';
import { toOptionalId } from '../../utils/ids';
import { StockReturnDialog } from './StockReturnDialog';

/**
 * Stock Return — "md files/Stock/stock.md" §13, §14.
 *
 * The counters at the top are clickable filters over the list below them, which is every stock out
 * seen from the return side: issued, returned, balance, status.
 */
export default function StockReturnPage() {
  const navigate = useNavigate();
  const canView = usePermission('RENT', 'canView');
  const canCreate = usePermission('RENT', 'canCreate');
  const canExport = usePermission('RENT', 'canExport');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [returnStatus, setReturnStatus] = useState<StockReturnStatus | ''>('');
  const [rentalPersonId, setRentalPersonId] = useState('');
  const [returningStockOut, setReturningStockOut] = useState<StockOutDetail | null>(null);
  const [loadingReturnFor, setLoadingReturnFor] = useState<number | null>(null);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['rent-return-summary'],
    queryFn: () => rentService.getReturnSummary(),
    enabled: canView,
  });

  const { data: persons } = useQuery({
    queryKey: ['rent-persons', 'picker'],
    queryFn: () => rentService.listPersons({ limit: 100 }),
    enabled: canView,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['rent-stock-outs', 'returns-view', { page, limit, search, returnStatus, rentalPersonId }],
    queryFn: () =>
      rentService.listStockOuts({
        page,
        limit,
        search: search || undefined,
        returnStatus: returnStatus || undefined,
        rentalPersonId: toOptionalId(rentalPersonId),
      }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  // The dialog needs the stock out's line-level balances, which the list rows do not carry.
  async function openReturnDialog(row: StockOutSummary) {
    setLoadingReturnFor(row.id);
    try {
      setReturningStockOut(await rentService.getStockOut(row.id));
    } finally {
      setLoadingReturnFor(null);
    }
  }

  function toggleStatus(next: StockReturnStatus) {
    setReturnStatus((current) => (current === next ? '' : next));
    setPage(1);
  }

  const columns: DataTableColumn<StockOutSummary>[] = [
    {
      key: 'rentNo',
      header: 'Rent No',
      sortable: true,
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
            {row.rentNo}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {formatDate(row.stockOutDate)}
          </Typography>
        </Stack>
      ),
      exportValue: (row) => row.rentNo,
    },
    {
      key: 'person',
      header: 'Rental Person',
      sortable: true,
      render: (row) => (
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {row.rentalPerson.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.rentalPerson.phone}
          </Typography>
        </Stack>
      ),
      exportValue: (row) => row.rentalPerson.name,
    },
    {
      key: 'expectedReturnDate',
      header: 'Expected Return',
      align: 'center',
      render: (row) => formatDate(row.expectedReturnDate),
      exportValue: (row) => (row.expectedReturnDate ? formatDate(row.expectedReturnDate) : ''),
    },
    {
      key: 'issuedQuantity',
      header: 'Issued',
      align: 'right',
      render: (row) => row.issuedQuantity,
      exportValue: (row) => String(row.issuedQuantity),
    },
    {
      key: 'returnedQuantity',
      header: 'Returned',
      align: 'right',
      render: (row) => row.returnedQuantity,
      exportValue: (row) => String(row.returnedQuantity),
    },
    {
      key: 'pendingQuantity',
      header: 'Balance',
      align: 'right',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: row.pendingQuantity > 0 ? 'warning.main' : 'success.main' }}
        >
          {row.pendingQuantity}
        </Typography>
      ),
      exportValue: (row) => String(row.pendingQuantity),
    },
    {
      key: 'returnCount',
      header: 'Returns',
      align: 'center',
      width: 100,
      render: (row) => (
        <Chip size="small" label={row.returnCount} sx={{ fontWeight: 700, bgcolor: 'action.selected' }} />
      ),
      exportValue: (row) => String(row.returnCount),
    },
    {
      key: 'returnStatus',
      header: 'Status',
      align: 'center',
      width: 150,
      render: (row) => <StatusBadge type="rentReturn" status={row.returnStatus} size="sm" />,
      exportValue: (row) => row.returnStatus,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: 150,
      render: (row) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          {canCreate && row.returnStatus !== 'RETURNED' && (
            <Button
              size="small"
              variant="outlined"
              disabled={loadingReturnFor === row.id}
              onClick={(event) => {
                event.stopPropagation();
                void openReturnDialog(row);
              }}
            >
              {loadingReturnFor === row.id ? 'Opening…' : 'Return'}
            </Button>
          )}
          <Tooltip title="View stock out">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/rent/stock-outs/${row.id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to view stock returns.</Typography>;
  }

  return (
    <Box>
      <PageHeader
        title="Stock Return"
        subtitle="Every stock out, seen from the return side"
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Rent', to: '/rent' }, { label: 'Stock Return' }]}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
          mb: 3,
        }}
      >
        <StatCard
          label="Total Stock Out"
          value={summary?.totalStockOuts ?? 0}
          icon={<Inventory2OutlinedIcon />}
          tone="blue"
          subtext={`${summary?.totalIssuedQuantity ?? 0} items issued`}
          loading={loadingSummary}
          onClick={() => {
            setReturnStatus('');
            setPage(1);
          }}
          selected={returnStatus === ''}
        />
        <StatCard
          label="Not Returned"
          value={summary?.notReturned ?? 0}
          icon={<PendingActionsIcon />}
          tone="red"
          loading={loadingSummary}
          onClick={() => toggleStatus('NOT_RETURNED')}
          selected={returnStatus === 'NOT_RETURNED'}
        />
        <StatCard
          label="Partial Returned"
          value={summary?.partialReturned ?? 0}
          icon={<HourglassBottomIcon />}
          tone="amber"
          subtext={`${
            Math.round(((summary?.totalIssuedQuantity ?? 0) - (summary?.totalReturnedQuantity ?? 0)) * 100) / 100
          } items still out`}
          loading={loadingSummary}
          onClick={() => toggleStatus('PARTIAL_RETURNED')}
          selected={returnStatus === 'PARTIAL_RETURNED'}
        />
        <StatCard
          label="Returned"
          value={summary?.returned ?? 0}
          icon={<CheckCircleOutlineIcon />}
          tone="green"
          subtext={`${summary?.totalReturnedQuantity ?? 0} items back`}
          loading={loadingSummary}
          onClick={() => toggleStatus('RETURNED')}
          selected={returnStatus === 'RETURNED'}
        />
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: '16px' }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: 220, height: 40, display: 'flex', alignItems: 'center' }}>
            <SearchBar
              fullWidth
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by rent no, person, phone, item..."
            />
          </Box>
          <TextField
            select
            size="small"
            label="Rental Person"
            sx={{ width: 210 }}
            value={rentalPersonId}
            onChange={(event) => {
              setRentalPersonId(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {persons?.records.map((person) => (
              <MenuItem key={person.id} value={person.id}>
                {person.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

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
        onRowClick={(row) => navigate(`/rent/stock-outs/${row.id}`)}
        onRefresh={() => refetch()}
        refreshing={isFetching}
        emptyState={{
          icon: <AssignmentReturnIcon sx={{ fontSize: 36 }} />,
          title: 'Nothing to return',
          description: 'Stock outs appear here as soon as stock has been issued.',
        }}
        exportFileName="stock-returns"
        canExport={canExport}
      />

      <StockReturnDialog
        open={Boolean(returningStockOut)}
        stockOut={returningStockOut}
        onClose={() => setReturningStockOut(null)}
      />
    </Box>
  );
}
