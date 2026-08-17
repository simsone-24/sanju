import { Router } from 'express';
import authRoutes from '../modules/auth/routes';
import calendarRoutes from '../modules/calendar/routes';
import customersRoutes from '../modules/customers/routes';
import documentsRoutes from '../modules/documents/routes';
import enquiriesRoutes from '../modules/enquiries/routes';
import eventTypesRoutes from '../modules/event-types/routes';
import invoicesRoutes from '../modules/invoices/routes';
import ordersRoutes from '../modules/orders/routes';
import paymentMethodsRoutes from '../modules/payment-methods/routes';
import paymentTrackerRoutes from '../modules/payment-tracker/routes';
import paymentsRoutes from '../modules/payments/routes';
import permissionsRoutes from '../modules/permissions/routes';
import quotationsRoutes from '../modules/quotations/routes';
import rentDashboardRoutes from '../modules/rent-dashboard/routes';
import rentItemsRoutes from '../modules/rent-items/routes';
import rentPaymentsRoutes from '../modules/rent-payments/routes';
import rentPersonsRoutes from '../modules/rent-persons/routes';
import rentReportsRoutes from '../modules/rent-reports/routes';
import rentReturnsRoutes from '../modules/rent-returns/routes';
import rentStockOutsRoutes from '../modules/rent-stock-outs/routes';
import reportsRoutes from '../modules/reports/routes';
import settingsRoutes from '../modules/settings/routes';
import taskPlanRoutes from '../modules/task-plan/routes';
import taskTemplatesRoutes from '../modules/task-templates/routes';
import tasksRoutes from '../modules/tasks/routes';
import userGroupsRoutes from '../modules/user-groups/routes';
import usersRoutes from '../modules/users/routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/user-groups', userGroupsRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/event-types', eventTypesRoutes);
router.use('/task-templates', taskTemplatesRoutes);
router.use('/payment-methods', paymentMethodsRoutes);
router.use('/customers', customersRoutes);
router.use('/enquiries', enquiriesRoutes);
router.use('/quotations', quotationsRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/payment-tracker', paymentTrackerRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/tasks', tasksRoutes);
router.use('/task-plan', taskPlanRoutes);
router.use('/calendar', calendarRoutes);

// Rent — "md files/Stock/stock.md" §30. A standalone workflow with no link to enquiries, quotations
// or orders, so it owns its own /rent namespace rather than hanging off any of theirs.
router.use('/rent/persons', rentPersonsRoutes);
router.use('/rent/items', rentItemsRoutes);
router.use('/rent/stock-outs', rentStockOutsRoutes);
router.use('/rent/returns', rentReturnsRoutes);
router.use('/rent/payments', rentPaymentsRoutes);
router.use('/rent/dashboard', rentDashboardRoutes);
router.use('/rent/reports', rentReportsRoutes);

router.use('/reports', reportsRoutes);
router.use('/settings', settingsRoutes);
router.use('/documents', documentsRoutes);

export default router;
