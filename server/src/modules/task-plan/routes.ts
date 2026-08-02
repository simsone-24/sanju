import { Request, Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize, authorizeAny } from '../../middleware/authorize';
import { createImageUploader } from '../../middleware/upload';
import { validate } from '../../middleware/validate';
import { ModuleName } from '../permissions/catalog';
import * as taskPlanController from './controller';
import {
  changeTaskGroupStatusSchema,
  createTaskGroupSchema,
  createTaskItemSchema,
  updateTaskGroupSchema,
  updateTaskItemSchema,
} from './validation';

// scope.md §Completion Photo — an image proof shot from a phone; 5MB matches the image limits
// used elsewhere and keeps mobile uploads on site practical.
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const photoUploader = createImageUploader('task-photos', MAX_PHOTO_SIZE_BYTES);

// Task Plan is the Planning module's Phase 1 surface, so it reuses ModuleName.PLANNING for RBAC
// rather than introducing a new permission row.
const router = Router();

router.use(authenticate);

router.put(
  '/groups/:id',
  authorize(ModuleName.PLANNING, 'canEdit'),
  validate(updateTaskGroupSchema),
  taskPlanController.updateGroup,
);
// Publishing a draft group is an edit of the plan, not an approval step, so it stays on canEdit.
router.patch(
  '/groups/:id/status',
  authorize(ModuleName.PLANNING, 'canEdit'),
  validate(changeTaskGroupStatusSchema),
  taskPlanController.changeGroupStatus,
);
router.delete('/groups/:id', authorize(ModuleName.PLANNING, 'canDelete'), taskPlanController.deleteGroup);
router.post(
  '/groups/:id/items',
  authorize(ModuleName.PLANNING, 'canCreate'),
  validate(createTaskItemSchema),
  taskPlanController.createItemForGroup,
);

// masters/user.md §Worker gives a worker "View" plus "Update Checklist" and nothing else: enough to
// tick a task off and note what happened, not enough to rename or restructure the plan. So an update
// that only touches the checklist fields (status, remarks) also passes with canUpdateChecklist,
// while renaming a task still needs canEdit.
const CHECKLIST_FIELDS = ['status', 'remarks'];
const isChecklistOnlyUpdate = (req: Request): boolean => {
  const fields = Object.keys(req.body ?? {});
  return fields.length > 0 && fields.every((field) => CHECKLIST_FIELDS.includes(field));
};

router.put(
  '/items/:id',
  authorizeAny(
    { module: ModuleName.PLANNING, action: 'canEdit' },
    { module: ModuleName.PLANNING, action: 'canUpdateChecklist', when: isChecklistOnlyUpdate },
  ),
  validate(updateTaskItemSchema),
  taskPlanController.updateItem,
);
router.delete('/items/:id', authorize(ModuleName.PLANNING, 'canDelete'), taskPlanController.deleteItem);

router.get('/items/:id/photo', authorize(ModuleName.PLANNING, 'canView'), taskPlanController.getItemPhoto);
// The completion photo is the proof half of ticking a task off, so it follows Update Checklist too.
router.post(
  '/items/:id/photo',
  authorizeAny(
    { module: ModuleName.PLANNING, action: 'canEdit' },
    { module: ModuleName.PLANNING, action: 'canUpdateChecklist' },
  ),
  photoUploader.single('photo'),
  taskPlanController.uploadItemPhoto,
);
router.delete(
  '/items/:id/photo',
  authorizeAny(
    { module: ModuleName.PLANNING, action: 'canEdit' },
    { module: ModuleName.PLANNING, action: 'canUpdateChecklist' },
  ),
  taskPlanController.deleteItemPhoto,
);

export default router;

// Mounted under /orders/:id/task-plan by the Orders router — same nesting pattern as
// orderPaymentsRouter and orderDocumentsRouter. mergeParams surfaces the order id from the
// parent route as req.params.id here.
export const orderTaskPlanRouter = Router({ mergeParams: true });
orderTaskPlanRouter.use(authenticate);
orderTaskPlanRouter.get('/', authorize(ModuleName.PLANNING, 'canView'), taskPlanController.listForOrder);
orderTaskPlanRouter.post(
  '/',
  authorize(ModuleName.PLANNING, 'canCreate'),
  validate(createTaskGroupSchema),
  taskPlanController.createGroupForOrder,
);
