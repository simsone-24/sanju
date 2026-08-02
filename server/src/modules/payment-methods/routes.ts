import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as paymentMethodsController from './controller';

const router = Router();

router.use(authenticate);
// The payment-method list is a fixed enum rather than company data, and it fills the dropdown on the
// record-payment form — a group with Payment Tracker rights but no Masters rights (masters/user.md
// §Accountant) has to be able to read it, so authentication alone is the gate.
router.get('/', paymentMethodsController.list);

export default router;
