import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize, authorizeAny } from '../../middleware/authorize';
import { ModuleName } from '../permissions/catalog';
import * as reportsController from './controller';

const router = Router();

router.use(authenticate);
router.get('/revenue', authorize(ModuleName.REPORTS, 'canView'), reportsController.revenue);
router.get('/outstanding', authorize(ModuleName.REPORTS, 'canView'), reportsController.outstanding);
router.get('/customers', authorize(ModuleName.REPORTS, 'canView'), reportsController.customers);
router.get('/events', authorize(ModuleName.REPORTS, 'canView'), reportsController.events);
// Order figures are order data, so seeing them needs the Orders module's View as well as Reports
// (the main page) or Dashboard Reports (the dashboard tab).
router.get(
  '/orders',
  authorizeAny(
    { module: ModuleName.REPORTS, action: 'canView' },
    { module: ModuleName.DASHBOARD_REPORTS, action: 'canView' },
  ),
  authorize(ModuleName.ORDERS, 'canView'),
  reportsController.orders,
);
// Expense figures are expense data, so seeing them needs the Expenses module's View as well as Reports
// (the main page) or Dashboard Reports (the dashboard tab).
router.get(
  '/expenses',
  authorizeAny(
    { module: ModuleName.REPORTS, action: 'canView' },
    { module: ModuleName.DASHBOARD_REPORTS, action: 'canView' },
  ),
  authorize(ModuleName.EXPENSES, 'canView'),
  reportsController.expenses,
);

export default router;
