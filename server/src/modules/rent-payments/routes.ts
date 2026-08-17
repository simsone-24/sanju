import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as rentPaymentsController from './controller';
import { createRentPaymentSchema, updateRentPaymentSchema } from './validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.RENT, 'canView'), rentPaymentsController.list);
// Registered before "/:id" so "summary" isn't captured as an id.
router.get('/summary', authorize(ModuleName.RENT, 'canView'), rentPaymentsController.summary);
router.get('/:id', authorize(ModuleName.RENT, 'canView'), rentPaymentsController.getById);
router.post(
  '/',
  authorize(ModuleName.RENT, 'canCreate'),
  validate(createRentPaymentSchema),
  rentPaymentsController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.RENT, 'canEdit'),
  validate(updateRentPaymentSchema),
  rentPaymentsController.update,
);
router.delete('/:id', authorize(ModuleName.RENT, 'canDelete'), rentPaymentsController.remove);

export default router;
