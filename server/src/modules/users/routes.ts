import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { createImageUploader } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as usersController from './controller';
import { createUserSchema, updateUserSchema } from './validation';

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB — matches the company logo limit.
const photoUploader = createImageUploader('users', MAX_PHOTO_SIZE_BYTES);

const router = Router();

router.use(authenticate);

// Assignment pickers ("Assigned To", "Coordinator") live in Enquiries and Orders, which user.md's
// sample groups grant without any Masters access — so the id/name list every authenticated user
// needs is deliberately not behind the Masters gate. It exposes nothing beyond a name; the full
// records below stay guarded.
router.get('/options', usersController.listOptions);

router.get('/', authorize(ModuleName.MASTERS, 'canView'), usersController.list);
router.get('/:id', authorize(ModuleName.MASTERS, 'canView'), usersController.getById);
router.get('/:id/photo', authorize(ModuleName.MASTERS, 'canView'), usersController.getProfilePhoto);
router.post('/', authorize(ModuleName.MASTERS, 'canCreate'), validate(createUserSchema), usersController.create);
router.put('/:id', authorize(ModuleName.MASTERS, 'canEdit'), validate(updateUserSchema), usersController.update);
router.post(
  '/:id/photo',
  authorize(ModuleName.MASTERS, 'canEdit'),
  photoUploader.single('photo'),
  usersController.uploadProfilePhoto,
);
router.delete('/:id', authorize(ModuleName.MASTERS, 'canDelete'), usersController.remove);

export default router;
