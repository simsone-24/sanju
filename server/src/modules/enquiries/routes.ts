import { EnquiryStatus } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize, authorizeWhen } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as enquiriesController from './controller';
import { changeEnquiryStatusSchema, createEnquirySchema, createFollowUpSchema, updateEnquirySchema } from './validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.ENQUIRIES, 'canView'), enquiriesController.list);
router.get('/stats', authorize(ModuleName.ENQUIRIES, 'canView'), enquiriesController.getStats);
router.get('/:id', authorize(ModuleName.ENQUIRIES, 'canView'), enquiriesController.getById);
router.get('/:id/timeline', authorize(ModuleName.ENQUIRIES, 'canView'), enquiriesController.getTimeline);
// An enquiry created straight at ORDER_CONFIRMED converts on the spot (service.ts create), so it
// needs Convert to Order just as the status change below does.
router.post(
  '/',
  authorize(ModuleName.ENQUIRIES, 'canCreate'),
  authorizeWhen(
    (req) => req.body?.status === EnquiryStatus.ORDER_CONFIRMED,
    ModuleName.ENQUIRIES,
    'canConvertToOrder',
  ),
  validate(createEnquirySchema),
  enquiriesController.create,
);
// Assign is its own permission (masters/user.md §Enquiries), but the assignee travels inside the
// ordinary update payload — whether it is being *changed* can only be told by comparing it with the
// stored value, so that check lives in the service rather than in a middleware here.
router.put(
  '/:id',
  authorize(ModuleName.ENQUIRIES, 'canEdit'),
  validate(updateEnquirySchema),
  enquiriesController.update,
);
// Confirming an enquiry is what creates the order — the service converts automatically on the way
// into ORDER_CONFIRMED (service.ts changeStatus → ordersService.autoConvertFromEnquiry) — so that
// one transition additionally requires Convert to Order.
router.patch(
  '/:id/status',
  authorize(ModuleName.ENQUIRIES, 'canChangeStatus'),
  authorizeWhen(
    (req) => req.body?.status === EnquiryStatus.ORDER_CONFIRMED,
    ModuleName.ENQUIRIES,
    'canConvertToOrder',
  ),
  validate(changeEnquiryStatusSchema),
  enquiriesController.changeStatus,
);
// Deleting an enquiry cascades: its quotations, its order, and that order's payments, invoice,
// payment tracker, task plan and documents all go with it (service.ts remove). Guarded by the
// module's own Delete permission, which no group holds until an admin grants it.
router.delete('/:id', authorize(ModuleName.ENQUIRIES, 'canDelete'), enquiriesController.remove);
router.post(
  '/:id/follow-ups',
  authorize(ModuleName.ENQUIRIES, 'canCreate'),
  validate(createFollowUpSchema),
  enquiriesController.addFollowUp,
);

export default router;
