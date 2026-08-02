import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as userGroupsController from './controller';
import { createUserGroupSchema, updateUserGroupSchema } from './validation';

const router = Router();

router.use(authenticate);

// User Groups is one of the two masters in masters/user.md, so it is guarded by the Masters
// permissions rather than a module of its own.
router.get('/', authorize(ModuleName.MASTERS, 'canView'), userGroupsController.list);
// Registered before "/:id" so "options" isn't captured as an id.
router.get('/options', authorize(ModuleName.MASTERS, 'canView'), userGroupsController.listOptions);
router.get('/:id', authorize(ModuleName.MASTERS, 'canView'), userGroupsController.getById);
router.post(
  '/',
  authorize(ModuleName.MASTERS, 'canCreate'),
  validate(createUserGroupSchema),
  userGroupsController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.MASTERS, 'canEdit'),
  validate(updateUserGroupSchema),
  userGroupsController.update,
);
router.delete('/:id', authorize(ModuleName.MASTERS, 'canDelete'), userGroupsController.remove);

export default router;
