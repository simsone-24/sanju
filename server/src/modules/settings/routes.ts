import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createImageUploader } from '../../middleware/upload';
import { ModuleName } from '../permissions/catalog';
import * as settingsController from './controller';
import { updateCompanySchema } from './validation';

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const logoUploader = createImageUploader('company', MAX_LOGO_SIZE_BYTES);

const router = Router();

router.use(authenticate);
router.get('/company', authorize(ModuleName.SETTINGS, 'canView'), settingsController.getCompany);
router.put(
  '/company',
  authorize(ModuleName.SETTINGS, 'canEdit'),
  validate(updateCompanySchema),
  settingsController.updateCompany,
);
router.post(
  '/company/logo',
  authorize(ModuleName.SETTINGS, 'canEdit'),
  logoUploader.single('logo'),
  settingsController.uploadLogo,
);

export default router;
