import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { ModuleName } from '../permissions/catalog';
import * as rentDashboardController from './controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.RENT, 'canView'), rentDashboardController.getDashboard);

export default router;
