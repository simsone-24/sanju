import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { createDocumentUploader } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as documentsController from './controller';
import { uploadDocumentSchema } from './validation';

const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const documentUploader = createDocumentUploader('documents', MAX_DOCUMENT_SIZE_BYTES);

// Documents is a sub-resource of Orders (Order Tab 6) — not a top-level module in
// 03_MODULES.md §1 or a row in 10_IMPLEMENTATION_DECISIONS.md §1's permission matrix — so it's
// gated by ModuleName.ORDERS rather than introducing another RBAC module.
const router = Router();

router.use(authenticate);
router.get('/:id/file', authorize(ModuleName.ORDERS, 'canView'), documentsController.downloadFile);
router.delete('/:id', authorize(ModuleName.ORDERS, 'canEdit'), documentsController.remove);

export default router;

// Mounted under /orders/:id/documents by the Orders router — same nesting pattern as
// orderPaymentsRouter and orderTasksRouter.
export const orderDocumentsRouter = Router({ mergeParams: true });
orderDocumentsRouter.use(authenticate);
orderDocumentsRouter.get('/', authorize(ModuleName.ORDERS, 'canView'), documentsController.listForOrder);
orderDocumentsRouter.post(
  '/',
  authorize(ModuleName.ORDERS, 'canEdit'),
  documentUploader.single('file'),
  validate(uploadDocumentSchema),
  documentsController.uploadForOrder,
);
