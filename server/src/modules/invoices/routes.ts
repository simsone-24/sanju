import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { ModuleName } from '../permissions/catalog';
import * as invoicesController from './controller';

const router = Router();

router.use(authenticate);

// Guarded by PAYMENTS canPrint — masters/user.md §Payment Tracker lists "Print Receipt" as its own
// action, and this endpoint backs the printable invoice. canView is required as well: the invoice is
// the billing face of the same money the Payment Tracker shows, so a group that cannot see payments
// must not reach it here either.
//
// A GET that can allocate an invoice number is deliberate — the number is issued the first time the
// document is opened and reused forever after, so the call is idempotent from the second request on
// and no separate "issue" step is imposed on the user.
router.get(
  '/order/:orderId',
  authorize(ModuleName.PAYMENTS, 'canView'),
  authorize(ModuleName.PAYMENTS, 'canPrint'),
  invoicesController.getForOrder,
);

export default router;
