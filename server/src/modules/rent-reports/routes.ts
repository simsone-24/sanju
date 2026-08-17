import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { ModuleName } from '../permissions/catalog';
import * as rentReportsController from './controller';

// Rent's own reports, gated on Rent rather than on the Reports module: they read rent data only, so
// a group that can see rent can see its reports, and one that cannot must not reach them through
// the Reports screen either.
const router = Router();

router.use(authenticate);

router.get('/stock-out', authorize(ModuleName.RENT, 'canView'), rentReportsController.stockOutReport);
router.get('/returns', authorize(ModuleName.RENT, 'canView'), rentReportsController.returnReport);
router.get(
  '/pending-returns',
  authorize(ModuleName.RENT, 'canView'),
  rentReportsController.pendingReturnReport,
);
router.get('/payments', authorize(ModuleName.RENT, 'canView'), rentReportsController.paymentReport);
router.get(
  '/person-summary',
  authorize(ModuleName.RENT, 'canView'),
  rentReportsController.personSummaryReport,
);

export default router;
