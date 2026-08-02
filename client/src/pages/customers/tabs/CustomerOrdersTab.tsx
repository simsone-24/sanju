import { Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { StatusBadge } from '../../../components/StatusBadge';
import { usePermission } from '../../../hooks/usePermission';
import type { CustomerOrderSummary } from '../../../types/customer';
import { formatCurrency, formatDate } from '../../../utils/format';

interface CustomerOrdersTabProps {
  previousEvents: CustomerOrderSummary[];
  upcomingEvents: CustomerOrderSummary[];
}

const ORDER_COLUMNS: DataTableColumn<CustomerOrderSummary>[] = [
  { key: 'orderNumber', header: 'Order No', sortable: true },
  {
    key: 'eventDate',
    header: 'Event Date',
    render: (row) => formatDate(row.eventDate),
    exportValue: (row) => formatDate(row.eventDate),
  },
  { key: 'venue', header: 'Venue', render: (row) => row.venue ?? '—', exportValue: (row) => row.venue ?? '' },
  {
    key: 'totalAmount',
    header: 'Total',
    align: 'right',
    render: (row) => formatCurrency(row.totalAmount),
    exportValue: (row) => row.totalAmount,
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <StatusBadge type="order" status={row.status} />,
    exportValue: (row) => row.status,
  },
];

export default function CustomerOrdersTab({ previousEvents, upcomingEvents }: CustomerOrdersTabProps) {
  const canExport = usePermission('ORDERS', 'canExport');
  const navigate = useNavigate();

  return (
    <>
      <Typography variant="h2" sx={{ mb: 1 }}>
        Upcoming Events
      </Typography>
      <DataTable
        columns={ORDER_COLUMNS}
        rows={upcomingEvents}
        getRowId={(row) => row.id}
        page={1}
        limit={100}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
        emptyMessage="No upcoming events."
        exportFileName="upcoming-events"
        canExport={canExport}
      />

      <Typography variant="h2" sx={{ mt: 3, mb: 1 }}>
        Previous Events
      </Typography>
      <DataTable
        columns={ORDER_COLUMNS}
        rows={previousEvents}
        getRowId={(row) => row.id}
        page={1}
        limit={100}
        onPageChange={() => {}}
        onLimitChange={() => {}}
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
        emptyMessage="No previous events."
        exportFileName="previous-events"
        canExport={canExport}
      />
    </>
  );
}
