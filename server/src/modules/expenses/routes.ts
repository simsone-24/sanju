import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { createDocumentUploader } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as expensesController from './controller';
import { discardReceiptOnError } from './receipt';
import { MAX_RECEIPTS_PER_EXPENSE } from './types';
import { createExpenseSchema, updateExpenseSchema } from './validation';

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
// JPEG, PNG, WebP or PDF — the shared document uploader's allow-list.
const receiptUploader = createDocumentUploader('expenses', MAX_RECEIPT_SIZE_BYTES);

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.EXPENSES, 'canView'), expensesController.list);
router.get('/:id', authorize(ModuleName.EXPENSES, 'canView'), expensesController.getById);
router.get(
  '/:id/receipts/:receiptId',
  authorize(ModuleName.EXPENSES, 'canView'),
  expensesController.downloadReceipt,
);
router.post(
  '/',
  authorize(ModuleName.EXPENSES, 'canCreate'),
  receiptUploader.array('receipts', MAX_RECEIPTS_PER_EXPENSE),
  validate(createExpenseSchema),
  expensesController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.EXPENSES, 'canEdit'),
  receiptUploader.array('receipts', MAX_RECEIPTS_PER_EXPENSE),
  validate(updateExpenseSchema),
  expensesController.update,
);
router.delete('/:id', authorize(ModuleName.EXPENSES, 'canDelete'), expensesController.remove);
// The inverse, from Audit Log → Deleted Items. Same permission as deleting.
router.post('/:id/restore', authorize(ModuleName.EXPENSES, 'canDelete'), expensesController.restore);

router.use(discardReceiptOnError);

export default router;
