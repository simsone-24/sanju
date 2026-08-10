import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { Box, TextField } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { usePermission } from '../../../hooks/usePermission';
import * as reportService from '../../../services/reportService';
import type { CustomerListItem } from '../../../types/customer';
import { formatCurrency, formatDate } from '../../../utils/format';
import { ReportFilterBar } from '../ReportFilterBar';
import { ReportPanel } from '../ReportPanel';

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

  function clearFilters() {
    setCity('');
    setPage(1);
  }

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
      // Zero owed is the normal case and shouldn't shout — only a real balance takes the red.
      render: (row) => (
        <Box
          component="span"
          sx={{
            fontWeight: Number(row.outstandingAmount) > 0 ? 700 : 400,
            color: Number(row.outstandingAmount) > 0 ? 'error.dark' : 'text.primary',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(row.outstandingAmount)}
        </Box>
      ),
      exportValue: (row) => row.outstandingAmount,
    },
  ];

  return (
    <>
      <ReportFilterBar onClear={clearFilters} active={Boolean(city)}>
        <TextField
          size="small"
          label="City"
          value={city}
          onChange={(event) => {
            setCity(event.target.value);
            setPage(1);
          }}
        />
      </ReportFilterBar>

      <ReportPanel icon={<PeopleAltOutlinedIcon fontSize="small" />} title="Customers">
        <DataTable
          disableContainer
          columns={columns}
          rows={data?.customers ?? []}
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
          exportFileName="customer-report"
          canExport={canExport}
          emptyState={{
            icon: <PeopleAltOutlinedIcon sx={{ fontSize: 36 }} />,
            title: 'No customers found',
            description: 'No customer matches this city filter.',
          }}
        />
      </ReportPanel>
    </>
  );
}
