import * as paymentService from '../services/paymentService';
import { formatCurrency } from '../utils/format';
import { useConfirmedAction } from './useConfirmedAction';

/** The part of a payment row the confirmation needs — every place payments are listed has these. */
export interface PaymentToDelete {
  id: number;
  receiptNumber: string;
  amount: string;
}

/**
 * Delete-a-payment for any screen that lists an order's receipts. The server puts the order's
 * collected / balance figures and payment status back as if the payment had never been taken, so the
 * prompt says so, and every view of that money is refreshed afterwards.
 */
export function useDeletePayment(orderNumber: string) {
  return useConfirmedAction<PaymentToDelete>({
    title: 'Delete payment?',
    message: (payment) => (
      <>
        Delete receipt <strong>{payment.receiptNumber}</strong> for {formatCurrency(payment.amount)} from order{' '}
        {orderNumber}? The order&apos;s collected amount, balance and payment status are recalculated without it.
        The receipt is kept and listed under Audit Log → Deleted Items.
      </>
    ),
    action: (payment) => paymentService.remove(payment.id),
    invalidate: [
      ['payment-tracker'],
      ['orders'],
      ['order'],
      ['order-timeline'],
      ['customer'],
      ['invoice'],
      ['dashboard'],
      ['reports'],
    ],
    fallbackError: 'Unable to delete the payment. Please try again.',
  });
}
