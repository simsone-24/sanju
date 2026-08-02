import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as eventTypesController from './controller';
import { createEventTypeSchema, updateEventTypeSchema } from './validation';

const router = Router();

router.use(authenticate);

// Reading the list needs no Masters access: it is the source of the Event Type dropdown on the
// enquiry form, and masters/user.md's sample groups (Manager, Sales Executive) are given full
// Enquiries rights with no Masters rights at all — gating it would make those groups unable to
// raise an enquiry. Everything that changes the master data below still requires Masters.
router.get('/', eventTypesController.list);
router.get('/:id', authorize(ModuleName.MASTERS, 'canView'), eventTypesController.getById);
router.post(
  '/',
  authorize(ModuleName.MASTERS, 'canCreate'),
  validate(createEventTypeSchema),
  eventTypesController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.MASTERS, 'canEdit'),
  validate(updateEventTypeSchema),
  eventTypesController.update,
);
router.delete('/:id', authorize(ModuleName.MASTERS, 'canDelete'), eventTypesController.remove);

export default router;
