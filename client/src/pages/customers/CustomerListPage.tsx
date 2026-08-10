import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlineOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Avatar, Box, Button, Chip, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { SearchBar } from '../../components/SearchBar';
import { usePermission } from '../../hooks/usePermission';
import * as customerService from '../../services/customerService';
import type { CustomerListItem } from '../../types/customer';
import { formatCurrency, formatDate } from '../../utils/format';

// Row-left accent: customers still owed money read as amber, fully settled ones stay neutral —
// mirrors the ORDER_ROW_ACCENT pattern on the Orders list (rowAccentColor runs outside a
// theme-aware sx function, so this is a literal value, not a theme token).
function customerRowAccent(row: CustomerListItem): string | undefined {
  return Number(row.outstandingAmount) > 0 ? '#F59E0B' : undefined;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

// No "Add Customer" button — docs/03_MODULES.md §6: "Customer records are created automatically.
// No manual creation." Customers are only ever created as a side effect of a New Enquiry
// (server/src/modules/customers/service.ts's create() isn't exposed via its own route), so this
// page is view-only by design, not an unfinished CRUD page.
export default function CustomerListPage() {
  const navigate = useNavigate();
  const canView = usePermission('CUSTOMERS', 'canView');
  const canExport = usePermission('CUSTOMERS', 'canExport');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, limit, search, city }],
    queryFn: () => customerService.list({ page, limit, search: search || undefined, city: city || undefined }),
    placeholderData: keepPreviousData,
    enabled: canView,
  });

  const activeFilters: { key: string; label: string; onClear: () => void }[] = [];
  if (search) activeFilters.push({ key: 'search', label: `Search: "${search}"`, onClear: () => setSearch('') });
  if (city) activeFilters.push({ key: 'city', label: `City: ${city}`, onClear: () => setCity('') });

  function resetFilters() {
    setSearch('');
    setCity('');
    setPage(1);
  }

  const columns: DataTableColumn<CustomerListItem>[] = [
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (row) => (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 34, height: 34, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
            {initialsOf(row.customerName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {row.customerName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {row.customerCode}
            </Typography>
          </Box>
        </Stack>
      ),
      exportValue: (row) => row.customerName,
    },
    {
      key: 'mobile',
      header: 'Contact',
      align: 'center',
      render: (row) => (
        <Stack spacing={0.25} sx={{ alignItems: 'center' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <PhoneOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="body2" noWrap sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {row.mobile}
            </Typography>
          </Stack>
          {row.email && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.email}
            </Typography>
          )}
        </Stack>
      ),
      exportValue: (row) => row.mobile,
    },
    {
      key: 'city',
      header: 'City',
      align: 'center',
      render: (row) =>
        row.city ? (
          <Chip
            size="small"
            variant="outlined"
            icon={<PlaceOutlinedIcon sx={{ fontSize: '14px !important' }} />}
            label={row.city}
          />
        ) : (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        ),
      exportValue: (row) => row.city ?? '',
    },
    {
      key: 'totalEvents',
      header: 'Total Events',
      align: 'center',
      width: 120,
      render: (row) => (
        <Chip
          size="small"
          label={row.totalEvents}
          sx={{ fontWeight: 700, bgcolor: 'action.selected', minWidth: 34 }}
        />
      ),
      exportValue: (row) => String(row.totalEvents),
    },
    {
      key: 'lastEvent',
      header: 'Last Event',
      align: 'center',
      render: (row) => (row.lastEvent ? formatDate(row.lastEvent) : '—'),
      exportValue: (row) => (row.lastEvent ? formatDate(row.lastEvent) : ''),
    },
    {
      key: 'outstandingAmount',
      header: 'Outstanding Amount',
      align: 'center',
      render: (row) => {
        const outstanding = Number(row.outstandingAmount);
        if (outstanding <= 0) {
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
              Settled
            </Typography>
          );
        }
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>
            {formatCurrency(row.outstandingAmount)}
          </Typography>
        );
      },
      exportValue: (row) => row.outstandingAmount,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: 80,
      render: (row) => (
        <Tooltip title="View customer">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/customers/${row.id}`);
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Customers"
        subtitle={`${data?.meta.totalRecords ?? 0} total records`}
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Customers' }]}
      />

      <Paper
        variant="outlined"
        sx={(t) => ({
          p: 2,
          mb: 3,
          borderRadius: '16px',
          boxShadow: '0 12px 32px -18px rgba(15, 23, 42, 0.12)',
          ...t.applyStyles('dark', { boxShadow: '0 12px 32px -18px rgba(0, 0, 0, 0.55)' }),
        })}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-end', flexWrap: 'wrap', rowGap: 2 }}>
            <Box sx={{ flexGrow: 1, minWidth: 220, height: 40, display: 'flex', alignItems: 'center' }}>
              <SearchBar
                fullWidth
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Search by name, mobile, email..."
              />
            </Box>

            <Box sx={{ width: 200 }}>
              <TextField
                size="small"
                fullWidth
                label="City"
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setPage(1);
                }}
              />
            </Box>

            <Button
              variant="outlined"
              size="small"
              sx={{ height: 40 }}
              disabled={activeFilters.length === 0}
              onClick={resetFilters}
            >
              Reset
            </Button>
          </Stack>

          {activeFilters.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Active filters
              </Typography>
              {activeFilters.map((filter) => (
                <Chip key={filter.key} label={filter.label} size="small" onDelete={filter.onClear} />
              ))}
              <Button size="small" onClick={resetFilters}>
                Clear all
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {canView ? (
        <DataTable
          columns={columns}
          rows={data?.records ?? []}
          getRowId={(row) => row.id}
          loading={isLoading}
          meta={data?.meta}
          page={page}
          limit={limit}
          rowAccentColor={customerRowAccent}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          onRowClick={(row) => navigate(`/customers/${row.id}`)}
          emptyState={{
            icon: <PeopleOutlineIcon sx={{ fontSize: 36 }} />,
            title: 'Your Customer List is Waiting',
            description: 'Customer records appear automatically once you create your first enquiry.',
            action: activeFilters.length > 0 ? <Button onClick={resetFilters}>Reset Filters</Button> : undefined,
          }}
          exportFileName="customers"
          canExport={canExport}
        />
      ) : (
        <Typography color="text.secondary">You do not have access to view customers.</Typography>
      )}
    </Box>
  );
}
