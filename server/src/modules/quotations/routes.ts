import { QuotationStatus } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize, authorizeWhen } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createPhotoUploader } from '../../middleware/upload';
import { ModuleName } from '../permissions/catalog';
import * as quotationsController from './controller';
import { MAX_QUOTATION_IMAGES } from './types';
import {
  bulkDeleteQuotationsSchema,
  changeQuotationStatusSchema,
  createQuotationSchema,
  updateQuotationImageSchema,
  updateQuotationSchema,
  uploadQuotationImagesSchema,
} from './validation';

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
// The form carries a Status field, so saving straight into APPROVED does everything the dedicated
// approve route below does — and therefore has to answer to the same canApprove permission. Without
// this a role holding only canCreate/canEdit could approve by picking it from the dropdown.
router.post(
  '/',
  authorize(ModuleName.QUOTATIONS, 'canCreate'),
  authorizeWhen(
    (req) => req.body?.status === QuotationStatus.APPROVED,
    ModuleName.QUOTATIONS,
    'canApprove',
  ),
  validate(createQuotationSchema),
  quotationsController.create,
);
router.put(
  '/:id',
  authorize(ModuleName.QUOTATIONS, 'canEdit'),
  authorizeWhen(
    (req) => req.body?.status === QuotationStatus.APPROVED,
    ModuleName.QUOTATIONS,
    'canApprove',
  ),
  validate(updateQuotationSchema),
  quotationsController.update,
);
router.patch(
  '/:id/status',
  authorize(ModuleName.QUOTATIONS, 'canEdit'),
  validate(changeQuotationStatusSchema),
  quotationsController.changeStatus,
);
// Soft delete — the row is kept with deleted_at set. See quotationsService.remove for what blocks it.
router.delete('/:id', authorize(ModuleName.QUOTATIONS, 'canDelete'), quotationsController.remove);
// Bulk soft delete for the list page's selection: the same rules as DELETE /:id, checked for every
// quotation before any is removed. A POST because a body on DELETE isn't reliably passed through.
router.post(
  '/bulk-delete',
  authorize(ModuleName.QUOTATIONS, 'canDelete'),
  validate(bulkDeleteQuotationsSchema),
  quotationsController.removeMany,
);
// The inverse, from Audit Log → Deleted Items. Same permission as deleting.
router.post('/:id/restore', authorize(ModuleName.QUOTATIONS, 'canDelete'), quotationsController.restore);
// Approval is gated on canApprove specifically, not canEdit — per the seeded matrix, Sales
// Executive can create/edit quotations but only Manager/Super Admin can approve them.
router.patch('/:id/approve', authorize(ModuleName.QUOTATIONS, 'canApprove'), quotationsController.approve);

// Sample decor images (JPEG/PNG) — attached to a saved quotation, rendered on the PDF gallery page.
router.post(
  '/:id/images',
  authorize(ModuleName.QUOTATIONS, 'canEdit'),
  imageUploader.array('images', MAX_QUOTATION_IMAGES),
  validate(uploadQuotationImagesSchema),
  quotationsController.uploadImages,
);
router.patch(
  '/:id/images/:imageId',
  authorize(ModuleName.QUOTATIONS, 'canEdit'),
  validate(updateQuotationImageSchema),
  quotationsController.updateImage,
);
router.delete('/:id/images/:imageId', authorize(ModuleName.QUOTATIONS, 'canEdit'), quotationsController.deleteImage);

export default router;
