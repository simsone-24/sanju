import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as tasksController from './controller';
import { createOrderTaskSchema, updateOrderTaskSchema } from './validation';

const router = Router();

router.use(authenticate);
router.patch('/:id', authorize(ModuleName.PLANNING, 'canEdit'), validate(updateOrderTaskSchema), tasksController.update);

export default router;

// Mounted under /orders/:id/tasks by the Orders router — same nesting pattern as
// orderPaymentsRouter in modules/payments/routes.ts. mergeParams surfaces the order id from
// the parent route as req.params.id here.
export const orderTasksRouter = Router({ mergeParams: true });
orderTasksRouter.use(authenticate);
orderTasksRouter.get('/', authorize(ModuleName.PLANNING, 'canView'), tasksController.listForOrder);
orderTasksRouter.post(
  '/',
  authorize(ModuleName.PLANNING, 'canCreate'),
  validate(createOrderTaskSchema),
  tasksController.createForOrder,
);
