import type { DataTableColumn } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import type { OrderStatus } from '../../types/order';
import type { PaymentTrackerStatus } from '../../types/paymentTracker';
import { formatCurrency, formatDate } from '../../utils/format';

/** What the order-wise report tables need from a row — the Revenue and Outstanding rows both fit. */
export interface ReportOrderRow {
  id: number;
  orderNumber: string;
  /** Null on an order confirmed before its event date was known. */
  eventDate: string | null;
  status: OrderStatus;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  customer: { customerName: string; mobile: string | null };
  enquiry: { eventName: string | null; eventType: { eventName: string } } | null;
  paymentTracker: { paymentStatus: PaymentTrackerStatus } | null;
}

/**
 * The columns of an order-wise report table, laid out like the Payment Tracker's: Order No,
 * Customer, Event, Event Date, Order Status, Budget, Collected, Balance, Payment Status. Shared by the
 * Revenue and Outstanding tabs so the two read as the same table.
 */
export function reportOrderColumns<T extends ReportOrderRow>(): DataTableColumn<T>[] {
  return [
    {
      key: 'orderNumber',
      header: 'Order No',
      align: 'center',
      render: (row) => <span className="tw-font-bold tw-tabular-nums">{row.orderNumber}</span>,
      exportValue: (row) => row.orderNumber,
    },
    {
      key: 'customer',
      header: 'Customer',
      align: 'center',
      render: (row) => (
        <div className="tw-min-w-0">
          <div className="tw-truncate tw-font-semibold tw-leading-tight">{row.customer.customerName}</div>
          <div className="tw-truncate tw-text-xs tw-text-ink-muted dark:tw-text-ink-dark-muted">
            {row.customer.mobile}
          </div>
        </div>
      ),
      exportValue: (row) => row.customer.customerName,
    },
    {
      key: 'event',
      header: 'Event',
      align: 'center',
      render: (row) => row.enquiry?.eventName || row.enquiry?.eventType.eventName || '—',
      exportValue: (row) => row.enquiry?.eventName || row.enquiry?.eventType.eventName || '',
    },
    {
      key: 'eventDate',
      header: 'Event Date',
      align: 'center',
      render: (row) =>
        row.eventDate ? (
          <span className="tw-font-semibold">{formatDate(row.eventDate)}</span>
        ) : (
          <span className="tw-text-ink-muted dark:tw-text-ink-dark-muted">Not scheduled</span>
        ),
      exportValue: (row) => (row.eventDate ? formatDate(row.eventDate) : ''),
    },
    {
      key: 'status',
      header: 'Order Status',
      align: 'center',
      render: (row) => <StatusBadge type="order" status={row.status} size="sm" />,
      exportValue: (row) => row.status,
    },
    {
      key: 'totalAmount',
      header: 'Budget',
      align: 'center',
      render: (row) => <span className="tw-tabular-nums">{formatCurrency(row.totalAmount)}</span>,
      exportValue: (row) => row.totalAmount,
    },
    {
      key: 'paidAmount',
      header: 'Collected',
      align: 'center',
      render: (row) => (
        <span className={`tw-tabular-nums tw-font-semibold ${Number(row.paidAmount) > 0 ? 'tw-text-success' : ''}`}>
          {formatCurrency(row.paidAmount)}
        </span>
      ),
      exportValue: (row) => row.paidAmount,
    },
    {
      key: 'pendingAmount',
      header: 'Balance',
      align: 'center',
      render: (row) => (
        <span
          className={`tw-tabular-nums tw-font-semibold ${
            Number(row.pendingAmount) > 0 ? 'tw-text-warning' : 'tw-text-ink-muted dark:tw-text-ink-dark-muted'
          }`}
        >
          {formatCurrency(row.pendingAmount)}
        </span>
      ),
      exportValue: (row) => row.pendingAmount,
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      align: 'center',
      render: (row) => (
        <StatusBadge type="paymentTracker" status={row.paymentTracker?.paymentStatus ?? 'PENDING'} size="sm" />
      ),
      exportValue: (row) => row.paymentTracker?.paymentStatus ?? 'PENDING',
    },
  ];
}
