import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as paymentTrackerController from './controller';
import { updatePaymentTrackerSchema } from './validation';

const router = Router();

router.use(authenticate);

// Reuses the PAYMENTS permission: the tracker is a second view over the same money, so a role that
// may not see payments must not reach it through this route either.
router.get('/', authorize(ModuleName.PAYMENTS, 'canView'), paymentTrackerController.list);
// Registered before "/:orderId" so "stats" isn't captured as an order id.
router.get('/stats', authorize(ModuleName.PAYMENTS, 'canView'), paymentTrackerController.stats);
router.get('/:orderId', authorize(ModuleName.PAYMENTS, 'canView'), paymentTrackerController.getByOrderId);
router.get('/:orderId/history', authorize(ModuleName.PAYMENTS, 'canView'), paymentTrackerController.getHistory);
router.put(
  '/:orderId',
  authorize(ModuleName.PAYMENTS, 'canEdit'),
  validate(updatePaymentTrackerSchema),
  paymentTrackerController.update,
);

export default router;
