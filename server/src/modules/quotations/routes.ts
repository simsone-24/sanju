import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createPhotoUploader } from '../../middleware/upload';
import { ModuleName } from '../permissions/catalog';
import * as quotationsController from './controller';
import { changeQuotationStatusSchema, createQuotationSchema, updateQuotationSchema } from './validation';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB per image
const imageUploader = createPhotoUploader('quotation-images', MAX_IMAGE_SIZE_BYTES);

const router = Router();

router.use(authenticate);

router.get('/', authorize(ModuleName.QUOTATIONS, 'canView'), quotationsController.list);
// Registered before "/:id" so "grouped"/"stats"/"branding" aren't captured as an id.
router.get('/grouped', authorize(ModuleName.QUOTATIONS, 'canView'), quotationsController.listGrouped);
router.get('/stats', authorize(ModuleName.QUOTATIONS, 'canView'), quotationsController.stats);
router.get('/branding', authorize(ModuleName.QUOTATIONS, 'canView'), quotationsController.branding);
router.get('/:id', authorize(ModuleName.QUOTATIONS, 'canView'), quotationsController.getById);
router.get('/:id/timeline', authorize(ModuleName.QUOTATIONS, 'canView'), quotationsController.getTimeline);
// PDF download is gated on canPrint (matches the documented "Print/Download PDF" permission).
router.get('/:id/pdf', authorize(ModuleName.QUOTATIONS, 'canPrint'), quotationsController.downloadPdf);
router.post(
  '/',
  authorize(ModuleName.QUOTATIONS, 'canCreate'),
  validate(createQuotationSchema),
  quotationsController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.QUOTATIONS, 'canEdit'),
  validate(updateQuotationSchema),
  quotationsController.update,
);
router.patch(
  '/:id/status',
  authorize(ModuleName.QUOTATIONS, 'canEdit'),
  validate(changeQuotationStatusSchema),
  quotationsController.changeStatus,
);
// Approval is gated on canApprove specifically, not canEdit — per the seeded matrix, Sales
// Executive can create/edit quotations but only Manager/Super Admin can approve them.
router.patch('/:id/approve', authorize(ModuleName.QUOTATIONS, 'canApprove'), quotationsController.approve);

// Sample decor images (JPEG/PNG) — attached to a saved quotation, rendered on the PDF gallery page.
router.post(
  '/:id/images',
  authorize(ModuleName.QUOTATIONS, 'canEdit'),
  imageUploader.array('images', 12),
  quotationsController.uploadImages,
);
router.delete('/:id/images/:imageId', authorize(ModuleName.QUOTATIONS, 'canEdit'), quotationsController.deleteImage);

export default router;
