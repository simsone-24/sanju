import { Box, Typography } from '@mui/material';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppTabs } from '../../components/AppTabs';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { usePermission } from '../../hooks/usePermission';
import * as rentService from '../../services/rentService';
import type {
  PaymentReportRow,
  PendingReturnReportRow,
  PersonSummaryReportRow,
  RentReportFilters,
  ReturnReportRow,
  StockOutReportRow,
} from '../../types/rent';
import { formatCurrency, formatDate } from '../../utils/format';
import { RentReportFilterBar, ReportTotals, ReportTruncationNotice } from './RentReportFilterBar';

/** Rent reports — "md files/Stock/stock.md" §27. One tab per documented report. */
export default function RentReportsPage() {
  const canView = usePermission('RENT', 'canView');

  if (!canView) {
    return <Typography color="text.secondary">You do not have access to rent reports.</Typography>;
  }

  return (
    <Box>
      <PageHeader
        title="Rent Reports"
        subtitle="Stock out, returns, pending returns, payments and person-wise position"
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Rent', to: '/rent' }, { label: 'Reports' }]}
      />

      <AppTabs
        idPrefix="rent-reports"
        surface
        tabs={[
          { label: 'Stock Out', content: <StockOutReportTab /> },
          { label: 'Stock Return', content: <ReturnReportTab /> },
          { label: 'Pending Return', content: <PendingReturnReportTab /> },
          { label: 'Payment', content: <PaymentReportTab /> },
          { label: 'Person-wise', content: <PersonSummaryReportTab /> },
        ]}
      />
    </Box>
  );
}

// Reports render the whole filtered result set (capped server-side), so the table's pagination is
// not wired to a query — it stays on one page and the row cap is surfaced as a notice instead.
const UNPAGINATED = { page: 1, limit: 100, onPageChange: () => undefined, onLimitChange: () => undefined };

function StockOutReportTab() {
  const navigate = useNavigate();
  const canExport = usePermission('RENT', 'canExport');
  const [filters, setFilters] = useState<RentReportFilters>({});

  const { data, isLoading } = useQuery({
    queryKey: ['rent-report', 'stock-out', filters],
    queryFn: () => rentService.getStockOutReport(filters),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<StockOutReportRow>[] = [
    { key: 'rentNo', header: 'Stock Out No', render: (row) => row.rentNo, exportValue: (row) => row.rentNo },
    {
      key: 'person',
      header: 'Person',
      render: (row) => row.rentalPerson.name,
      exportValue: (row) => row.rentalPerson.name,
    },
    {
      key: 'stockOutDate',
      header: 'Date',
      align: 'center',
      render: (row) => formatDate(row.stockOutDate),
      exportValue: (row) => formatDate(row.stockOutDate),
    },
    {
      key: 'items',
      header: 'Items',
      render: (row) => row.items.map((item) => `${item.itemName} × ${item.quantity}`).join(', ') || '—',
      exportValue: (row) => row.items.map((item) => `${item.itemName} x ${item.quantity}`).join('; '),
    },
    {
      key: 'issuedQuantity',
      header: 'Quantity',
      align: 'right',
      render: (row) => row.issuedQuantity,
      exportValue: (row) => String(row.issuedQuantity),
    },
    {
      key: 'grandTotal',
      header: 'Amount',
      align: 'right',
      render: (row) => formatCurrency(row.grandTotal),
      exportValue: (row) => String(row.grandTotal),
    },
  ];

  return (
    <Box>
      <RentReportFilterBar
        config={{
          dateRange: true,
          person: true,
          item: true,
          search: true,
          searchPlaceholder: 'Search by stock out number…',
        }}
        filters={filters}
        onChange={setFilters}
      />
      <ReportTruncationNotice truncated={data?.truncated ?? false} rowLimit={data?.rowLimit ?? 0} />
      <DataTable
        {...UNPAGINATED}
        columns={columns}
        rows={data?.rows ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        onRowClick={(row) => navigate(`/rent/stock-outs/${row.id}`)}
        emptyMessage="No stock outs match these filters."
        exportFileName="rent-stock-out-report"
        canExport={canExport}
      />
      {data && (
        <ReportTotals
          entries={[
            { label: 'Stock Outs', value: String(data.totals.stockOuts) },
            { label: 'Total Quantity', value: String(data.totals.quantity) },
            { label: 'Total Amount', value: formatCurrency(data.totals.amount) },
            { label: 'Paid', value: formatCurrency(data.totals.paid) },
            { label: 'Balance', value: formatCurrency(data.totals.balance) },
          ]}
        />
      )}
    </Box>
  );
}

function ReturnReportTab() {
  const navigate = useNavigate();
  const canExport = usePermission('RENT', 'canExport');
  const [filters, setFilters] = useState<RentReportFilters>({});

  const { data, isLoading } = useQuery({
    queryKey: ['rent-report', 'returns', filters],
    queryFn: () => rentService.getReturnReport(filters),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<ReturnReportRow>[] = [
    { key: 'rentNo', header: 'Stock Out No', render: (row) => row.rentNo, exportValue: (row) => row.rentNo },
    { key: 'personName', header: 'Person', render: (row) => row.personName, exportValue: (row) => row.personName },
    {
      key: 'stockOutDate',
      header: 'Date',
      align: 'center',
      render: (row) => formatDate(row.stockOutDate),
      exportValue: (row) => formatDate(row.stockOutDate),
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
      render: (row) => row.pendingQuantity,
      exportValue: (row) => String(row.pendingQuantity),
    },
    {
      key: 'returnStatus',
      header: 'Status',
      align: 'center',
      width: 150,
      render: (row) => <StatusBadge type="rentReturn" status={row.returnStatus} size="sm" />,
      exportValue: (row) => row.returnStatus,
    },
  ];

  return (
    <Box>
      <RentReportFilterBar
        config={{
          dateRange: true,
          person: true,
          item: true,
          returnStatus: true,
          search: true,
          searchPlaceholder: 'Search by stock out number…',
        }}
        filters={filters}
        onChange={setFilters}
      />
      <ReportTruncationNotice truncated={data?.truncated ?? false} rowLimit={data?.rowLimit ?? 0} />
      <DataTable
        {...UNPAGINATED}
        columns={columns}
        rows={data?.rows ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        onRowClick={(row) => navigate(`/rent/stock-outs/${row.id}`)}
        emptyMessage="No stock outs match these filters."
        exportFileName="rent-return-report"
        canExport={canExport}
      />
      {data && (
        <ReportTotals
          entries={[
            { label: 'Stock Outs', value: String(data.totals.stockOuts) },
            { label: 'Issued', value: String(data.totals.issued) },
            { label: 'Returned', value: String(data.totals.returned) },
            { label: 'Pending', value: String(data.totals.pending) },
          ]}
        />
      )}
    </Box>
  );
}

function PendingReturnReportTab() {
  const navigate = useNavigate();
  const canExport = usePermission('RENT', 'canExport');
  const [filters, setFilters] = useState<RentReportFilters>({});

  const { data, isLoading } = useQuery({
    queryKey: ['rent-report', 'pending-returns', filters],
    queryFn: () => rentService.getPendingReturnReport(filters),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<PendingReturnReportRow>[] = [
    { key: 'personName', header: 'Person', render: (row) => row.personName, exportValue: (row) => row.personName },
    { key: 'rentNo', header: 'Stock Out No', render: (row) => row.rentNo, exportValue: (row) => row.rentNo },
    { key: 'itemName', header: 'Item', render: (row) => row.itemName, exportValue: (row) => row.itemName },
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
      key: 'balanceQuantity',
      header: 'Balance',
      align: 'right',
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>
          {row.balanceQuantity}
        </Typography>
      ),
      exportValue: (row) => String(row.balanceQuantity),
    },
    {
      key: 'expectedReturnDate',
      header: 'Expected Return',
      align: 'center',
      render: (row) => formatDate(row.expectedReturnDate),
      exportValue: (row) => (row.expectedReturnDate ? formatDate(row.expectedReturnDate) : ''),
    },
  ];

  return (
    <Box>
      <RentReportFilterBar
        config={{
          dateRange: true,
          person: true,
          item: true,
          search: true,
          searchPlaceholder: 'Search by stock out number…',
        }}
        filters={filters}
        onChange={setFilters}
      />
      <ReportTruncationNotice truncated={data?.truncated ?? false} rowLimit={data?.rowLimit ?? 0} />
      <DataTable
        {...UNPAGINATED}
        columns={columns}
        rows={data?.rows ?? []}
        getRowId={(row) => `${row.stockOutId}-${row.itemName}`}
        loading={isLoading}
        onRowClick={(row) => navigate(`/rent/stock-outs/${row.stockOutId}`)}
        emptyMessage="Nothing is pending return."
        exportFileName="rent-pending-return-report"
        canExport={canExport}
      />
      {data && (
        <ReportTotals
          entries={[
            { label: 'Pending Lines', value: String(data.totals.lines) },
            { label: 'Issued', value: String(data.totals.issued) },
            { label: 'Returned', value: String(data.totals.returned) },
            { label: 'Still Out', value: String(data.totals.balance) },
          ]}
        />
      )}
    </Box>
  );
}

function PaymentReportTab() {
  const navigate = useNavigate();
  const canExport = usePermission('RENT', 'canExport');
  const [filters, setFilters] = useState<RentReportFilters>({});

  const { data, isLoading } = useQuery({
    queryKey: ['rent-report', 'payments', filters],
    queryFn: () => rentService.getPaymentReport(filters),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<PaymentReportRow>[] = [
    { key: 'personName', header: 'Person', render: (row) => row.personName, exportValue: (row) => row.personName },
    { key: 'rentNo', header: 'Stock Out', render: (row) => row.rentNo, exportValue: (row) => row.rentNo },
    {
      key: 'stockOutDate',
      header: 'Date',
      align: 'center',
      render: (row) => formatDate(row.stockOutDate),
      exportValue: (row) => formatDate(row.stockOutDate),
    },
    {
      key: 'grandTotal',
      header: 'Total Amount',
      align: 'right',
      render: (row) => formatCurrency(row.grandTotal),
      exportValue: (row) => String(row.grandTotal),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      render: (row) => formatCurrency(row.paidAmount),
      exportValue: (row) => String(row.paidAmount),
    },
    {
      key: 'balanceAmount',
      header: 'Balance',
      align: 'right',
      render: (row) => formatCurrency(row.balanceAmount),
      exportValue: (row) => String(row.balanceAmount),
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      align: 'center',
      width: 150,
      render: (row) => <StatusBadge type="rentPayment" status={row.paymentStatus} size="sm" />,
      exportValue: (row) => row.paymentStatus,
    },
  ];

  return (
    <Box>
      <RentReportFilterBar
        config={{
          dateRange: true,
          person: true,
          paymentMode: true,
          paymentStatus: true,
          search: true,
          searchPlaceholder: 'Search by stock out number…',
        }}
        filters={filters}
        onChange={setFilters}
      />
      <ReportTruncationNotice truncated={data?.truncated ?? false} rowLimit={data?.rowLimit ?? 0} />
      <DataTable
        {...UNPAGINATED}
        columns={columns}
        rows={data?.rows ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        onRowClick={(row) => navigate(`/rent/stock-outs/${row.id}`)}
        emptyMessage="No transactions match these filters."
        exportFileName="rent-payment-report"
        canExport={canExport}
      />
      {data && (
        <ReportTotals
          entries={[
            { label: 'Stock Outs', value: String(data.totals.stockOuts) },
            { label: 'Total Amount', value: formatCurrency(data.totals.amount) },
            { label: 'Paid', value: formatCurrency(data.totals.paid) },
            { label: 'Balance', value: formatCurrency(data.totals.balance) },
          ]}
        />
      )}
    </Box>
  );
}

function PersonSummaryReportTab() {
  const navigate = useNavigate();
  const canExport = usePermission('RENT', 'canExport');
  const [filters, setFilters] = useState<RentReportFilters>({});

  const { data, isLoading } = useQuery({
    queryKey: ['rent-report', 'person-summary', filters],
    queryFn: () => rentService.getPersonSummaryReport(filters),
    placeholderData: keepPreviousData,
  });

  const columns: DataTableColumn<PersonSummaryReportRow>[] = [
    {
      key: 'name',
      header: 'Rental Person',
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.phone}
          </Typography>
        </Box>
      ),
      exportValue: (row) => row.name,
    },
    {
      key: 'stockOutCount',
      header: 'Stock Outs',
      align: 'right',
      render: (row) => row.stockOutCount,
      exportValue: (row) => String(row.stockOutCount),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      align: 'right',
      render: (row) => formatCurrency(row.totalAmount),
      exportValue: (row) => String(row.totalAmount),
    },
    {
      key: 'paidAmount',
      header: 'Total Paid',
      align: 'right',
      render: (row) => formatCurrency(row.paidAmount),
      exportValue: (row) => String(row.paidAmount),
    },
    {
      key: 'pendingAmount',
      header: 'Total Pending',
      align: 'right',
      render: (row) =>
        row.pendingAmount > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>
            {formatCurrency(row.pendingAmount)}
          </Typography>
        ) : (
          formatCurrency(0)
        ),
      exportValue: (row) => String(row.pendingAmount),
    },
    {
      key: 'returnedCount',
      header: 'Returned',
      align: 'right',
      render: (row) => row.returnedCount,
      exportValue: (row) => String(row.returnedCount),
    },
    {
      key: 'pendingReturnCount',
      header: 'Pending Returns',
      align: 'right',
      render: (row) => row.pendingReturnCount,
      exportValue: (row) => String(row.pendingReturnCount),
    },
  ];

  return (
    <Box>
      <RentReportFilterBar
        config={{ search: true, searchPlaceholder: 'Search by name, phone, city…' }}
        filters={filters}
        onChange={setFilters}
      />
      <ReportTruncationNotice truncated={data?.truncated ?? false} rowLimit={data?.rowLimit ?? 0} />
      <DataTable
        {...UNPAGINATED}
        columns={columns}
        rows={data?.rows ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        onRowClick={(row) => navigate(`/rent/persons/${row.id}`)}
        emptyMessage="No rental persons match these filters."
        exportFileName="rent-person-summary-report"
        canExport={canExport}
      />
      {data && (
        <ReportTotals
          entries={[
            { label: 'Persons', value: String(data.totals.persons) },
            { label: 'Stock Outs', value: String(data.totals.stockOuts) },
            { label: 'Total Amount', value: formatCurrency(data.totals.amount) },
            { label: 'Paid', value: formatCurrency(data.totals.paid) },
            { label: 'Pending', value: formatCurrency(data.totals.pending) },
          ]}
        />
      )}
    </Box>
  );
}
