import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as returnsController from '../rent-returns/controller';
import { createStockReturnSchema } from '../rent-returns/validation';
import * as stockOutsController from './controller';
import { cancelStockOutSchema, createStockOutSchema, updateStockOutSchema } from './validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.RENT, 'canView'), stockOutsController.list);
router.get('/:id', authorize(ModuleName.RENT, 'canView'), stockOutsController.getById);
router.post(
  '/',
  authorize(ModuleName.RENT, 'canCreate'),
  validate(createStockOutSchema),
  stockOutsController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.RENT, 'canEdit'),
  validate(updateStockOutSchema),
  stockOutsController.update,
);
// Cancelling retires a transaction that cannot be deleted because it carries history, so it answers
// to the same permission as deleting rather than to Edit (stock.md §33).
router.patch(
  '/:id/cancel',
  authorize(ModuleName.RENT, 'canDelete'),
  validate(cancelStockOutSchema),
  stockOutsController.cancel,
);
router.delete('/:id', authorize(ModuleName.RENT, 'canDelete'), stockOutsController.remove);

// Booking a return is a create against the stock out that issued the stock (stock.md §30).
router.post(
  '/:id/returns',
  authorize(ModuleName.RENT, 'canCreate'),
  validate(createStockReturnSchema),
  returnsController.createForStockOut,
);

export default router;
