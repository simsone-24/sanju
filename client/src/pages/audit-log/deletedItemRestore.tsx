import type { ReactNode } from 'react';
import { useConfirmedAction } from '../../hooks/useConfirmedAction';
import { usePermission } from '../../hooks/usePermission';
import * as enquiryService from '../../services/enquiryService';
import * as expenseService from '../../services/expenseService';
import * as orderService from '../../services/orderService';
import * as paymentService from '../../services/paymentService';
import * as quotationService from '../../services/quotationService';
import * as userService from '../../services/userService';
import type { DeletedItemType } from '../../types/auditLog';
import { formatCurrency } from '../../utils/format';

/** The least a restore needs to know about a record — a table row and the view page both have these. */
export interface RestorableRecord {
  id: number;
  reference: string;
  title: string;
  amount: string | null;
}

// The call that brings each kind back. Restoring is the inverse of deleting, so each is allowed to
// whoever may delete that kind (the server enforces it; the button just isn't offered otherwise).
const RESTORE_CALL: Record<DeletedItemType, (id: number) => Promise<void>> = {
  ENQUIRIES: enquiryService.restore,
  QUOTATIONS: quotationService.restore,
  ORDERS: orderService.restore,
  PAYMENTS: paymentService.restore,
  EXPENSES: expenseService.restore,
  USERS: userService.restore,
};

// What the person is told before confirming — including what comes back with the record.
const RESTORE_MESSAGE: Record<DeletedItemType, (record: RestorableRecord) => ReactNode> = {
  ENQUIRIES: (record) => (
    <>
      Restore enquiry <strong>{record.reference}</strong> for {record.title}? It comes back with the quotations, order
      and payments that were deleted along with it.
    </>
  ),
  QUOTATIONS: (record) => (
    <>
      Restore quotation <strong>{record.reference}</strong> for {record.title}? It returns to the Quotations list.
    </>
  ),
  ORDERS: (record) => (
    <>
      Restore order <strong>{record.reference}</strong> for {record.title}? Its payments, invoice, tasks and documents
      that were deleted with it come back too.
    </>
  ),
  PAYMENTS: (record) => (
    <>
      Restore receipt <strong>{record.reference}</strong>
      {record.amount !== null && <> for {formatCurrency(record.amount)}</>} from {record.title}&apos;s order? The
      order&apos;s collected amount, balance and payment status are recalculated with it.
    </>
  ),
  EXPENSES: (record) => (
    <>
      Restore expense <strong>{record.reference}</strong> ({record.title}
      {record.amount !== null && <>, {formatCurrency(record.amount)}</>})? It returns to the Expenses list.
    </>
  ),
  USERS: (record) => (
    <>
      Restore user <strong>{record.title}</strong> ({record.reference})? They return in the state they were deleted in.
    </>
  ),
};

// Every view that could be showing the record, or the figures it feeds.
const REFRESH_AFTER_RESTORE = [
  ['audit-log'],
  ['enquiries'],
  ['enquiry'],
  ['quotations'],
  ['quotation'],
  ['orders'],
  ['order'],
  ['payment-tracker'],
  ['expenses'],
  ['users'],
  ['user-options'],
  ['customer'],
  ['calendar'],
  ['dashboard'],
  ['reports'],
] as const;

/**
 * Restoring one kind of deleted record: whether this person may (whoever may delete the kind may bring
 * it back; users sit under Masters), the confirmation, the call, and the refresh afterwards. Used by the
 * Deleted Items table and by the record's own view page, so they cannot drift apart.
 *
 * `onRestored` runs once the server has accepted the restore — the page uses it to leave a record that
 * is no longer deleted.
 */
export function useRestoreDeletedItem(type: DeletedItemType, onRestored?: (record: RestorableRecord) => void) {
  const canRestoreByType: Record<DeletedItemType, boolean> = {
    ENQUIRIES: usePermission('ENQUIRIES', 'canDelete'),
    QUOTATIONS: usePermission('QUOTATIONS', 'canDelete'),
    ORDERS: usePermission('ORDERS', 'canDelete'),
    PAYMENTS: usePermission('PAYMENTS', 'canDelete'),
    EXPENSES: usePermission('EXPENSES', 'canDelete'),
    USERS: usePermission('MASTERS', 'canDelete'),
  };

  const { request, dialog } = useConfirmedAction<RestorableRecord>({
    title: 'Restore this record?',
    message: (record) => RESTORE_MESSAGE[type](record),
    action: (record) => RESTORE_CALL[type](record.id),
    invalidate: REFRESH_AFTER_RESTORE,
    fallbackError: 'Unable to restore the record. Please try again.',
    confirmLabel: 'Restore',
    danger: false,
    onDone: onRestored,
  });

  return { canRestore: canRestoreByType[type], request, dialog };
}
