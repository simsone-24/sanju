import { useNavigate } from 'react-router-dom';
import { DataTable, type DataTableColumn } from '../../../components/DataTable';
import { usePermission } from '../../../hooks/usePermission';
import type { CustomerPaymentSummary } from '../../../types/customer';
import { formatCurrency, formatDate } from '../../../utils/format';

interface CustomerPaymentsTabProps {
  payments: CustomerPaymentSummary[];
}

export default function CustomerPaymentsTab({ payments }: CustomerPaymentsTabProps) {
  const canExport = usePermission('PAYMENTS', 'canExport');
  const navigate = useNavigate();

  const columns: DataTableColumn<CustomerPaymentSummary>[] = [
    {
      key: 'paymentDate',
      header: 'Date',
      render: (row) => formatDate(row.paymentDate),
      exportValue: (row) => formatDate(row.paymentDate),
    },
    { key: 'orderNumber', header: 'Order No', render: (row) => row.order.orderNumber, exportValue: (row) => row.order.orderNumber },
    { key: 'paymentType', header: 'Type', exportValue: (row) => row.paymentType },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => formatCurrency(row.amount),
      exportValue: (row) => row.amount,
    },
    { key: 'paymentMethod', header: 'Method', exportValue: (row) => row.paymentMethod },
    { key: 'receiptNumber', header: 'Receipt No', exportValue: (row) => row.receiptNumber },
  ];

  return (
    <DataTable
      columns={columns}
      rows={payments}
      getRowId={(row) => row.id}
      page={1}
      limit={100}
      onPageChange={() => {}}
      onLimitChange={() => {}}
      onRowClick={(row) => navigate(`/orders/${row.order.id}`)}
      emptyMessage="No payments recorded yet."
      exportFileName="customer-payments"
      canExport={canExport}
    />
  );
}
