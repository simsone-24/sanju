import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as customersController from './controller';
import { updateCustomerSchema } from './validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.CUSTOMERS, 'canView'), customersController.list);
router.get('/:id', authorize(ModuleName.CUSTOMERS, 'canView'), customersController.getById);
router.get('/:id/orders', authorize(ModuleName.CUSTOMERS, 'canView'), customersController.getHistory);
// Edits the customer master record itself — reachable from the Enquiry form's Existing Customer
// step (enquiry.md §Step 1), not just the customer profile page.
router.put(
  '/:id',
  authorize(ModuleName.CUSTOMERS, 'canEdit'),
  validate(updateCustomerSchema),
  customersController.update,
);

export default router;
