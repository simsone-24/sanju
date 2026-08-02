import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlineOutlined';
import { Box, Stack, TextField, Typography } from '@mui/material';
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

  const columns: DataTableColumn<CustomerListItem>[] = [
    { key: 'customerName', header: 'Customer Name', sortable: true },
    { key: 'mobile', header: 'Mobile' },
    { key: 'city', header: 'City', render: (row) => row.city ?? '—', exportValue: (row) => row.city ?? '' },
    { key: 'totalEvents', header: 'Total Events', align: 'right', exportValue: (row) => String(row.totalEvents) },
    {
      key: 'lastEvent',
      header: 'Last Event',
      render: (row) => (row.lastEvent ? formatDate(row.lastEvent) : '—'),
      exportValue: (row) => (row.lastEvent ? formatDate(row.lastEvent) : ''),
    },
    {
      key: 'outstandingAmount',
      header: 'Outstanding Amount',
      align: 'right',
      render: (row) => formatCurrency(row.outstandingAmount),
      exportValue: (row) => row.outstandingAmount,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Customers"
        subtitle={`${data?.meta.totalRecords ?? 0} total records`}
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Customers' }]}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by name, mobile, email..."
        />
        <TextField
          size="small"
          label="City"
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        />
      </Stack>

      {canView ? (
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
          onRowClick={(row) => navigate(`/customers/${row.id}`)}
          emptyState={{
            icon: <PeopleOutlineIcon sx={{ fontSize: 36 }} />,
            title: 'Your Customer List is Waiting',
            description: 'Customer records appear automatically once you create your first enquiry.',
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
