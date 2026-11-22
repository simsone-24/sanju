import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { usePermission } from '../../hooks/usePermission';
import { ReportPanel } from './ReportPanel';

// A month-wise table holds one row per calendar month — a dozen or so, never enough to page — so
// the table is given a page size no real report reaches and no pagination controls are shown.
const SINGLE_PAGE = 1000;

interface MonthlyReportTableProps<T> {
  title: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  loading?: boolean;
  exportFileName: string;
  emptyDescription: string;
}

/** The "report by month" panel the Revenue, Outstanding and Expenses reports share. */
export function MonthlyReportTable<T>({
  title,
  columns,
  rows,
  getRowId,
  loading,
  exportFileName,
  emptyDescription,
}: MonthlyReportTableProps<T>) {
  const canExport = usePermission('REPORTS', 'canExport');

  return (
    <ReportPanel icon={<CalendarMonthIcon fontSize="small" />} title={title}>
      <DataTable
        showSerialNumber
        disableContainer
        columns={columns}
        rows={rows}
        getRowId={getRowId}
        loading={loading}
        page={1}
        limit={SINGLE_PAGE}
        onPageChange={() => undefined}
        onLimitChange={() => undefined}
        exportFileName={exportFileName}
        canExport={canExport}
        emptyState={{
          icon: <CalendarMonthIcon sx={{ fontSize: 36 }} />,
          title: 'No monthly data',
          description: emptyDescription,
        }}
      />
    </ReportPanel>
  );
}
