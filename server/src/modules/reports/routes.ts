import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize, authorizeAny } from '../../middleware/authorize';
import { ModuleName } from '../permissions/catalog';
import * as reportsController from './controller';

const router = Router();

router.use(authenticate);
// One Reports-page tab per endpoint, each granted on its own.
router.get('/revenue', authorize(ModuleName.REPORTS, 'canViewRevenueReport'), reportsController.revenue);
router.get('/outstanding', authorize(ModuleName.REPORTS, 'canViewOutstandingReport'), reportsController.outstanding);
router.get('/customers', authorize(ModuleName.REPORTS, 'canViewCustomerReport'), reportsController.customers);
// No Reports tab reads this any more; it feeds the Dashboard's "upcoming events" tile, whose
// neighbouring event tiles all come from the Calendar endpoints — so it answers to the same View.
router.get('/events', authorize(ModuleName.CALENDAR, 'canView'), reportsController.events);
// Order figures are order data, so seeing them needs the Orders module's View as well as the Orders
// tab of the Reports page or the Dashboard's Reports tab.
router.get(
  '/orders',
  authorizeAny(
    { module: ModuleName.REPORTS, action: 'canViewOrderReport' },
    { module: ModuleName.DASHBOARD, action: 'canViewReports' },
  ),
  authorize(ModuleName.ORDERS, 'canView'),
  reportsController.orders,
);
// Expense figures are expense data, so seeing them needs the Expenses module's View as well as the
// Expenses tab of the Reports page or the Dashboard's Reports tab.
router.get(
  '/expenses',
  authorizeAny(
    { module: ModuleName.REPORTS, action: 'canViewExpenseReport' },
    { module: ModuleName.DASHBOARD, action: 'canViewReports' },
  ),
  authorize(ModuleName.EXPENSES, 'canView'),
  reportsController.expenses,
);

export default router;
