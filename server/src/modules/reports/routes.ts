import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { ModuleName } from '../permissions/catalog';
import * as reportsController from './controller';

const router = Router();

router.use(authenticate);
router.get('/revenue', authorize(ModuleName.REPORTS, 'canView'), reportsController.revenue);
router.get('/outstanding', authorize(ModuleName.REPORTS, 'canView'), reportsController.outstanding);
router.get('/customers', authorize(ModuleName.REPORTS, 'canView'), reportsController.customers);
router.get('/events', authorize(ModuleName.REPORTS, 'canView'), reportsController.events);

export default router;
