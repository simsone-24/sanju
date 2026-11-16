import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as expenseCategoriesController from './controller';
import { createExpenseCategorySchema, updateExpenseCategorySchema } from './validation';

const router = Router();

router.use(authenticate);

// Categories are managed under the Expenses module's own permissions rather than Masters: they
// exist only to classify expenses, and a group trusted to record expenses must be able to read the
// list that fills the form's category dropdown.
router.get('/', authorize(ModuleName.EXPENSES, 'canView'), expenseCategoriesController.list);
router.get('/:id', authorize(ModuleName.EXPENSES, 'canView'), expenseCategoriesController.getById);
router.post(
  '/',
  authorize(ModuleName.EXPENSES, 'canCreate'),
  validate(createExpenseCategorySchema),
  expenseCategoriesController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.EXPENSES, 'canEdit'),
  validate(updateExpenseCategorySchema),
  expenseCategoriesController.update,
);
router.delete('/:id', authorize(ModuleName.EXPENSES, 'canDelete'), expenseCategoriesController.remove);

export default router;
