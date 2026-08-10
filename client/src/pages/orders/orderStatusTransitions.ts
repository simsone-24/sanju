import type { OrderStatus } from '../../types/order';

// Every status, offered with no workflow-order restriction and no balance guard — any status may
// be set from any other at any time (orders/service.ts changeStatus): payment standing is tracked
// separately in the Payment Tracker module rather than gating this transition.
export const ALL_ORDER_STATUSES: OrderStatus[] = ['YET_TO_START', 'IN_PROGRESS', 'ORDER_CLOSED', 'REJECTED'];

export interface OrderStatusPermissions {
  canEdit: boolean;
  canCancel: boolean;
  canCompleteEvent: boolean;
}

/**
 * Every status this user may set (permission-gated, not workflow-gated) other than the one the
 * order is already at. masters/user.md §Orders makes Cancel Order and Complete Event permissions
 * in their own right, while every other move is an ordinary edit — mirroring the guards on
 * PATCH /orders/:id/status so the menu never offers a move the server will refuse on permission
 * grounds alone.
 */
export function allowedOrderTransitions(
  status: OrderStatus,
  permissions: OrderStatusPermissions,
): OrderStatus[] {
  return ALL_ORDER_STATUSES.filter((target) => {
    if (target === status) return false;
    if (target === 'REJECTED') return permissions.canCancel;
    if (target === 'ORDER_CLOSED') return permissions.canCompleteEvent;
    return permissions.canEdit;
  });
}

// Mirrors EVENT_DATE_LOCKED_STATUSES in the same backend file.
export const EVENT_DATE_LOCKED_STATUSES: OrderStatus[] = ['ORDER_CLOSED', 'REJECTED'];

// The stage progress tracker on the Order Details page ("md files/order/view.md" §Quick Progress
// Tracker). REJECTED is deliberately outside the sequence and rendered separately in red.
export type OrderStage = 'YET_TO_START' | 'IN_PROGRESS' | 'ORDER_CLOSED';

export const ORDER_STAGES: { key: OrderStage; label: string }[] = [
  { key: 'YET_TO_START', label: 'Yet to Start' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'ORDER_CLOSED', label: 'Order Closed' },
];

export function orderStage(status: OrderStatus): OrderStage | 'REJECTED' {
  return status;
}
