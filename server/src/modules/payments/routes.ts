import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as paymentsController from './controller';
import { createPaymentSchema } from './validation';

const router = Router();

router.use(authenticate);
router.get('/:id', authorize(ModuleName.PAYMENTS, 'canView'), paymentsController.getById);

export default router;

// Mounted under /orders/:id/payments by the Orders router — kept here since Payments owns the
// business logic, even though the URL lives under /orders per 05_API_SPECIFICATION.md §10.
// mergeParams is required so req.params.id (the order id from the parent route) is visible here.
export const orderPaymentsRouter = Router({ mergeParams: true });
orderPaymentsRouter.use(authenticate);
orderPaymentsRouter.get('/', authorize(ModuleName.PAYMENTS, 'canView'), paymentsController.listForOrder);
orderPaymentsRouter.post(
  '/',
  authorize(ModuleName.PAYMENTS, 'canCreate'),
  validate(createPaymentSchema),
  paymentsController.createForOrder,
);
