import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { ModuleName } from '../permissions/catalog';
import * as auditLogsController from './controller';

const router = Router();

// Read-only: the log is written by the other modules as they act and is never edited from here.
router.use(authenticate);
router.get('/filters', authorize(ModuleName.AUDIT_LOG, 'canView'), auditLogsController.filterOptions);
// Records that have been soft-deleted, by kind. Read-only: restoring one is done through the owning
// module's own POST /:id/restore, so the permission that guards it stays with that module.
router.get('/deleted/summary', authorize(ModuleName.AUDIT_LOG, 'canView'), auditLogsController.deletedSummary);
router.get('/deleted', authorize(ModuleName.AUDIT_LOG, 'canView'), auditLogsController.listDeleted);
// One deleted record in full, for its view page.
router.get('/deleted/:type/:id', authorize(ModuleName.AUDIT_LOG, 'canView'), auditLogsController.getDeleted);
router.get('/', authorize(ModuleName.AUDIT_LOG, 'canView'), auditLogsController.list);

export default router;
