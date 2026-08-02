import type { OrderStatus } from '../../types/order';

// Mirrors server/src/modules/orders/service.ts's ORDER_STATUS_TRANSITIONS exactly, so the
// status dropdown only ever offers moves the backend will actually accept. The order status
// tracks the EVENT/work lifecycle only — payment standing is derived separately
// (derivePaymentStatus in components/statusConfig.ts). The backend remains the real enforcer,
// including the "can't close with an outstanding balance" guard, which isn't replicated here
// and instead surfaces via the server's error message.
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CONFIRMED: ['PLANNING', 'CANCELLED'],
  PLANNING: ['READY', 'CANCELLED'],
  READY: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['CLOSED', 'CANCELLED'],
  CLOSED: [],
  CANCELLED: [],
  // Legacy bridges for orders raised before the event/payment status split.
  ADVANCE_PENDING: ['PLANNING', 'CANCELLED'],
  ADVANCE_RECEIVED: ['PLANNING', 'CANCELLED'],
  BALANCE_PENDING: ['CLOSED', 'CANCELLED'],
};

export interface OrderStatusPermissions {
  canEdit: boolean;
  canCancel: boolean;
  canCompleteEvent: boolean;
}

/**
 * The transitions this user may actually perform. masters/user.md §Orders makes Cancel Order and
 * Complete Event permissions in their own right, while every other move is an ordinary edit —
 * mirroring the guards on PATCH /orders/:id/status so the menu never offers a move the server
 * will refuse.
 */
export function allowedOrderTransitions(
  status: OrderStatus,
  permissions: OrderStatusPermissions,
): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[status].filter((target) => {
    if (target === 'CANCELLED') return permissions.canCancel;
    if (target === 'COMPLETED') return permissions.canCompleteEvent;
    return permissions.canEdit;
  });
}

// Mirrors EVENT_DATE_LOCKED_STATUSES in the same backend file.
export const EVENT_DATE_LOCKED_STATUSES: OrderStatus[] = ['COMPLETED', 'BALANCE_PENDING', 'CLOSED', 'CANCELLED'];

// The three-stage progress tracker on the Order Details page ("md files/order/view.md" §Quick
// Progress Tracker). Collapses the work lifecycle into the stages a coordinator actually thinks
// in; CANCELLED is deliberately outside the sequence and rendered separately in red. Mirrors the
// server's ORDER_STATUS_GROUPS so the tracker and the Orders dashboard cards can't disagree.
export type OrderStage = 'PLANNING' | 'WORK_STARTED' | 'COMPLETED';

export const ORDER_STAGES: { key: OrderStage; label: string }[] = [
  { key: 'PLANNING', label: 'Planning Created' },
  { key: 'WORK_STARTED', label: 'Work Started' },
  { key: 'COMPLETED', label: 'Event Completed' },
];

export function orderStage(status: OrderStatus): OrderStage | 'CANCELLED' {
  if (status === 'CANCELLED') return 'CANCELLED';
  if (status === 'IN_PROGRESS') return 'WORK_STARTED';
  if (status === 'COMPLETED' || status === 'BALANCE_PENDING' || status === 'CLOSED') return 'COMPLETED';
  return 'PLANNING';
}
