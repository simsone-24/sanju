import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { ModuleName } from '../permissions/catalog';
import * as customersController from './controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.CUSTOMERS, 'canView'), customersController.list);
router.get('/:id', authorize(ModuleName.CUSTOMERS, 'canView'), customersController.getById);
router.get('/:id/orders', authorize(ModuleName.CUSTOMERS, 'canView'), customersController.getHistory);

export default router;
