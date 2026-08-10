import { OrderStatus } from '@prisma/client';
import { Router } from 'express';
import { orderDocumentsRouter } from '../documents/routes';
import { orderPaymentsRouter } from '../payments/routes';
import { orderTaskPlanRouter } from '../task-plan/routes';
import { orderTasksRouter } from '../tasks/routes';
import { authenticate } from '../../middleware/authenticate';
import { authorize, authorizeWhen } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as ordersController from './controller';
import { changeOrderStatusSchema, convertToOrderSchema, updateOrderSchema } from './validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.ORDERS, 'canView'), ordersController.list);
// Registered before "/:id" so "stats" isn't captured as an id.
router.get('/stats', authorize(ModuleName.ORDERS, 'canView'), ordersController.stats);
// Turning an approved quotation into an order is the one way an order comes into existence, and
// masters/user.md books it under two permissions: Orders → Create and Enquiries → Convert to Order.
// Both are required, so either one can be withheld to stop a group converting.
router.get(
  '/eligible-enquiries',
  authorize(ModuleName.ORDERS, 'canCreate'),
  authorize(ModuleName.ENQUIRIES, 'canConvertToOrder'),
  ordersController.listEligibleEnquiries,
);
router.post(
  '/convert',
  authorize(ModuleName.ORDERS, 'canCreate'),
  authorize(ModuleName.ENQUIRIES, 'canConvertToOrder'),
  validate(convertToOrderSchema),
  ordersController.convert,
);
router.get('/:id', authorize(ModuleName.ORDERS, 'canView'), ordersController.getById);
router.get('/:id/timeline', authorize(ModuleName.ORDERS, 'canView'), ordersController.getTimeline);
router.put(
  '/:id',
  authorize(ModuleName.ORDERS, 'canEdit'),
  validate(updateOrderSchema),
  ordersController.update,
);
// Cancel Order and Complete Event are separate permissions in masters/user.md §Orders, but the app
// moves an order through both by the same status endpoint — so each transition is guarded by the
// permission that names it, and everything else stays on Edit.
router.patch(
  '/:id/status',
  authorizeWhen((req) => req.body?.status === OrderStatus.REJECTED, ModuleName.ORDERS, 'canCancel'),
  authorizeWhen((req) => req.body?.status === OrderStatus.ORDER_CLOSED, ModuleName.ORDERS, 'canCompleteEvent'),
  authorizeWhen(
    (req) => req.body?.status !== OrderStatus.REJECTED && req.body?.status !== OrderStatus.ORDER_CLOSED,
    ModuleName.ORDERS,
    'canEdit',
  ),
  validate(changeOrderStatusSchema),
  ordersController.changeStatus,
);
router.use('/:id/payments', orderPaymentsRouter);
router.use('/:id/tasks', orderTasksRouter);
router.use('/:id/task-plan', orderTaskPlanRouter);
router.use('/:id/documents', orderDocumentsRouter);

export default router;
