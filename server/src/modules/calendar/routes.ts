import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { ModuleName } from '../permissions/catalog';
import * as calendarController from './controller';

const router = Router();

router.use(authenticate);
router.get('/month', authorize(ModuleName.CALENDAR, 'canView'), calendarController.month);
router.get('/week', authorize(ModuleName.CALENDAR, 'canView'), calendarController.week);
router.get('/day', authorize(ModuleName.CALENDAR, 'canView'), calendarController.day);

export default router;
