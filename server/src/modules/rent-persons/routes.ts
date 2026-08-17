import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as rentPersonsController from './controller';
import { createRentalPersonSchema, updateRentalPersonSchema } from './validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.RENT, 'canView'), rentPersonsController.list);
router.get('/:id', authorize(ModuleName.RENT, 'canView'), rentPersonsController.getById);
router.post(
  '/',
  authorize(ModuleName.RENT, 'canCreate'),
  validate(createRentalPersonSchema),
  rentPersonsController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.RENT, 'canEdit'),
  validate(updateRentalPersonSchema),
  rentPersonsController.update,
);
router.delete('/:id', authorize(ModuleName.RENT, 'canDelete'), rentPersonsController.remove);

export default router;
