import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { ModuleName } from '../permissions/catalog';
import * as returnsController from './controller';

// Creating a return is reached through the stock out it belongs to
// (POST /rent/stock-outs/:id/returns — see rent-stock-outs/routes.ts), so this router is read-only.
const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.RENT, 'canView'), returnsController.list);
// Registered before "/:id" so "summary" isn't captured as an id.
router.get('/summary', authorize(ModuleName.RENT, 'canView'), returnsController.summary);
router.get('/:id', authorize(ModuleName.RENT, 'canView'), returnsController.getById);

export default router;
