import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as taskTemplatesController from './controller';
import { createTaskTemplateSchema, updateTaskTemplateSchema } from './validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.MASTERS, 'canView'), taskTemplatesController.list);
router.get('/:id', authorize(ModuleName.MASTERS, 'canView'), taskTemplatesController.getById);
router.post(
  '/',
  authorize(ModuleName.MASTERS, 'canCreate'),
  validate(createTaskTemplateSchema),
  taskTemplatesController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.MASTERS, 'canEdit'),
  validate(updateTaskTemplateSchema),
  taskTemplatesController.update,
);
router.delete('/:id', authorize(ModuleName.MASTERS, 'canDelete'), taskTemplatesController.remove);

export default router;
