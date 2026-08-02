import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { ModuleName } from './catalog';
import * as permissionsController from './controller';

const router = Router();

router.use(authenticate);

// The catalog only describes which permissions can be granted; it is consumed by the User Group and
// User permission editors, both of which already live behind Masters, so it carries the same gate.
router.get('/catalog', authorize(ModuleName.MASTERS, 'canView'), permissionsController.getCatalog);

export default router;
