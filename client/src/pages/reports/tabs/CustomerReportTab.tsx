import { Stack, TextField } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { usePermission } from '../../../hooks/usePermission';
import * as reportService from '../../../services/reportService';
import type { CustomerListItem } from '../../../types/customer';
import { formatCurrency, formatDate } from '../../../utils/format';

export default function CustomerReportTab() {
  const canExport = usePermission('REPORTS', 'canExport');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [city, setCity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'customers', { page, limit, city }],
    queryFn: () => reportService.getCustomers({ page, limit, city: city || undefined }),
    placeholderData: keepPreviousData,
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
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="City"
          value={city}
          onChange={(event) => { setCity(event.target.value); setPage(1); }}
          sx={{ minWidth: 200 }}
        />
      </Stack>

      <DataTable
        columns={columns}
        rows={data?.customers ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        meta={data?.meta}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
        emptyMessage="No customers found for the selected filters."
        exportFileName="customer-report"
        canExport={canExport}
      />
    </>
  );
}
