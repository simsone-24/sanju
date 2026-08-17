import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as rentItemsController from './controller';
import { createRentalItemSchema, updateRentalItemSchema } from './validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.RENT, 'canView'), rentItemsController.list);
// Registered before "/:id" so "categories" isn't captured as an id.
router.get('/categories', authorize(ModuleName.RENT, 'canView'), rentItemsController.listCategories);
router.get('/:id', authorize(ModuleName.RENT, 'canView'), rentItemsController.getById);
router.post(
  '/',
  authorize(ModuleName.RENT, 'canCreate'),
  validate(createRentalItemSchema),
  rentItemsController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.RENT, 'canEdit'),
  validate(updateRentalItemSchema),
  rentItemsController.update,
);
router.delete('/:id', authorize(ModuleName.RENT, 'canDelete'), rentItemsController.remove);

export default router;
